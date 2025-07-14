from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import io
import os # Для змінних середовища (поки не використовується активно для CORS)

app = Flask(__name__)

# Налаштування CORS:
# Для локальної розробки та простоти деплою поки що дозволимо з усіх джерел.
# У продакшені краще обмежити конкретними URL фронтенду.
# frontend_url = os.environ.get('FRONTEND_URL') 
# if frontend_url:
#     CORS(app, origins=[frontend_url, "http://localhost:3000", "http://localhost:3001"])
# else:
#     CORS(app) # Дозволяє з усіх джерел, якщо FRONTEND_URL не встановлено
CORS(app)


# Зберігатимемо завантажений DataFrame в пам'яті (дуже спрощено для MVP)
uploaded_df = None
uploaded_headers = []

@app.route('/upload', methods=['POST'])
def upload_csv():
    global uploaded_df, uploaded_headers

    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request."}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No file selected."}), 400
    
    if file and file.filename.endswith('.csv'):
        try:
            csv_data = file.stream.read().decode("utf-8")
            df = pd.read_csv(io.StringIO(csv_data), dtype='str', keep_default_na=False, na_values=[''])

            if df.empty:
                 return jsonify({"error": "CSV file is empty or contains only headers."}), 400

            df.columns = df.columns.str.strip() # Очищаємо пробіли з назв стовпців

            uploaded_df = df
            uploaded_headers = df.columns.tolist()

            return jsonify({
                "message": "File uploaded successfully. Headers are available.",
                "headers": uploaded_headers
            }), 200
        except pd.errors.EmptyDataError:
            return jsonify({"error": "CSV file is empty or has no data."}), 400
        except Exception as e:
            app.logger.error(f"Error processing uploaded file: {str(e)}")
            return jsonify({"error": f"Error processing uploaded CSV file: {str(e)}"}), 500
    else:
        return jsonify({"error": "Invalid file type. Please upload a .csv file."}), 400

@app.route('/process', methods=['POST'])
def process_data():
    global uploaded_df

    if uploaded_df is None:
        return jsonify({"error": "No data uploaded yet. Please upload a CSV file first."}), 400

    try:
        req_data = request.get_json()
        if not req_data:
            return jsonify({"error": "Missing JSON payload in request."}), 400

        x_column = req_data.get('x_column')
        y_column = req_data.get('y_column')
        chart_type = req_data.get('chart_type', 'bar')
        aggregation_type = req_data.get('aggregation_type')

        if not x_column:
            return jsonify({"error": "x_column (for X-axis/categories) is required."}), 400
        
        if x_column not in uploaded_df.columns:
            return jsonify({"error": f"Selected x_column '{x_column}' not found in the uploaded data."}), 400
        
        if chart_type in ['bar', 'line'] and not y_column and aggregation_type != 'count':
             return jsonify({"error": "y_column (for Y-axis/values) is required for bar/line charts unless aggregation is 'count'."}), 400
        if y_column and y_column not in uploaded_df.columns: # y_column може бути None
             return jsonify({"error": f"Selected y_column '{y_column}' not found in the uploaded data."}), 400
        if chart_type == 'pie' and aggregation_type == 'sum' and not y_column:
            return jsonify({"error": "y_column is required for 'sum' aggregation in a pie chart."}), 400


        df_copy = uploaded_df.copy()
        processed_y_column_name = y_column # Зберігаємо оригінальну назву або оновлюємо на 'count'/'sum'

        if chart_type == 'pie':
            if aggregation_type == 'sum':
                if not y_column: # Додаткова перевірка, хоча вище вже є
                    return jsonify({"error": "y_column is required for 'sum' aggregation in pie chart"}), 400
                try:
                    df_copy[y_column] = pd.to_numeric(df_copy[y_column], errors='coerce')
                    df_copy.dropna(subset=[y_column], inplace=True)
                    if df_copy.empty or df_copy[y_column].isnull().all():
                         return jsonify({"error": f"No valid numeric data found in column '{y_column}' for sum aggregation."}), 400
                    grouped_data = df_copy.groupby(x_column)[y_column].sum().reset_index()
                    processed_y_column_name = y_column # залишається ім'я стовпця Y
                except Exception as e:
                    return jsonify({"error": f"Error during 'sum' aggregation for pie chart: {str(e)}"}), 500
            elif aggregation_type == 'count':
                grouped_data = df_copy.groupby(x_column).size().reset_index(name='count')
                processed_y_column_name = 'count'
            else: # Немає агрегації для Pie, використовуємо значення Y як є, якщо X унікальні
                  # Або якщо X не унікальні, це буде не зовсім Pie, а скоріше помилка логіки вибору
                  # Для простоти, якщо немає агрегації для Pie, і є Y, то це помилка
                  # Якщо немає Y, то робимо 'count'
                if not y_column:
                    grouped_data = df_copy.groupby(x_column).size().reset_index(name='count')
                    processed_y_column_name = 'count'
                else: # Якщо є Y, але немає агрегації, для Pie це не стандартно
                    # Можна спробувати взяти перше значення, але краще помилка або вимагати агрегацію
                    # Для MVP, якщо є Y, але немає агрегації для Pie, повернемо помилку
                    # Однак, якщо X-категорії вже унікальні, то можна було б взяти Y як є.
                    # Поки що, якщо y_column є, а агрегації немає для pie - це не дуже логічно для MVP
                    # Давайте припустимо, що якщо Y є, то користувач ХОЧЕ бачити ці значення,
                    # але для Pie це має сенс, якщо X-категорії вже агреговані або унікальні.
                    # Якщо X не унікальні, то pandas візьме перше значення.
                    # Краще вимагати агрегацію або забезпечити, що X вже унікальні.
                    # Давайте спростимо: якщо y_column є, але немає sum/count, то для Pie просто беремо як є
                    # (хоча це може бути не те, що очікує користувач, якщо X не унікальні)
                    # АБО краще вимагати агрегацію:
                    return jsonify({"error": "For Pie chart with a Y-column, please specify 'sum' or 'count' aggregation."}), 400


            labels = grouped_data[x_column].astype(str).tolist()
            values = grouped_data[processed_y_column_name].tolist()

        elif chart_type in ['bar', 'line']:
            if aggregation_type == 'sum':
                if not y_column: return jsonify({"error": "y_column required for 'sum' aggregation."}), 400
                try:
                    df_copy[y_column] = pd.to_numeric(df_copy[y_column], errors='coerce')
                    df_copy.dropna(subset=[y_column], inplace=True)
                    if df_copy.empty or df_copy[y_column].isnull().all():
                         return jsonify({"error": f"No valid numeric data in column '{y_column}' for sum aggregation."}), 400
                    processed_df = df_copy.groupby(x_column, as_index=False)[y_column].sum()
                    processed_y_column_name = y_column
                except Exception as e:
                    return jsonify({"error": f"Error during 'sum' aggregation for {chart_type} chart: {str(e)}"}), 500
            elif aggregation_type == 'count':
                 processed_df = df_copy.groupby(x_column, as_index=False).size()
                 processed_df.rename(columns={'size': 'count'}, inplace=True)
                 processed_y_column_name = 'count'
            else: # Без агрегації
                if not y_column: return jsonify({"error": "y_column required for bar/line charts without 'count' aggregation."}), 400
                try:
                    df_copy[y_column] = pd.to_numeric(df_copy[y_column], errors='coerce')
                    if df_copy[y_column].isnull().all() and not df_copy[y_column].empty: # Перевіряємо, тільки якщо стовпець не порожній
                        return jsonify({"error": f"All values in column '{y_column}' are non-numeric or empty after conversion."}), 400
                    # Для bar/line Chart.js може обробити окремі null/NaN, тому не видаляємо рядки з NaN в Y
                except Exception as e:
                     return jsonify({"error": f"Could not convert y_column '{y_column}' to numeric: {str(e)}"}), 500
                processed_df = df_copy[[x_column, y_column]] # Беремо як є
                processed_y_column_name = y_column

            labels = processed_df[x_column].astype(str).tolist()
            values = processed_df[processed_y_column_name].tolist()
        else:
            return jsonify({"error": f"Unsupported chart_type: {chart_type}"}), 400

        return jsonify({
            "labels": labels,
            "values": values,
            "x_column_processed": x_column,
            "y_column_processed": processed_y_column_name 
        }), 200

    except KeyError as e:
        app.logger.error(f"KeyError in /process: {str(e)}")
        return jsonify({"error": f"Missing expected key in data or payload: {str(e)}"}), 400
    except Exception as e:
        app.logger.error(f"Unexpected error in /process endpoint: {str(e)}")
        return jsonify({"error": f"An unexpected error occurred during data processing: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)