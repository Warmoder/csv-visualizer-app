import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './App.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

function App() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState([]);
  
  const [selectedXColumn, setSelectedXColumn] = useState('');
  const [selectedYColumn, setSelectedYColumn] = useState('');
  const [selectedChartType, setSelectedChartType] = useState('bar');
  const [selectedAggregation, setSelectedAggregation] = useState('');

  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState('');
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isProcessingChart, setIsProcessingChart] = useState(false);

  useEffect(() => {
    if (!file) return;

    const uploadFile = async () => {
      const formData = new FormData();
      formData.append('file', file);
      setFileName(file.name);
      setIsLoadingFile(true);
      setError('');
      setHeaders([]);
      setChartData(null);
      setSelectedXColumn('');
      setSelectedYColumn('');
      setSelectedAggregation('');

      try {
        const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setHeaders(response.data.headers || []);
        if ((response.data.headers || []).length === 0) {
            setError("Файл завантажено, але не знайдено заголовків стовпців. Перевірте формат CSV.");
        }
      } catch (err) {
        handleApiError(err, 'завантаження файлу');
        setHeaders([]);
        setFileName('');
      } finally {
        setIsLoadingFile(false);
      }
    };
    uploadFile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const handleApiError = (err, actionContext) => {
    console.error(`Помилка ${actionContext}:`, err);
    let errorMessage = `Не вдалося виконати ${actionContext}.`;
    if (err.response && err.response.data && err.response.data.error) {
      errorMessage = `Помилка: ${err.response.data.error}`;
    } else if (err.request) {
      errorMessage = `Не вдалося зв'язатися з сервером (${actionContext}). Перевірте, чи запущено бекенд та чи правильна URL API.`;
    }
    setError(errorMessage);
  };

  const handleBuildChart = async () => {
    if (!selectedXColumn) {
      setError('Будь ласка, оберіть стовпець для осі X / Категорій.');
      return;
    }
    // Логіка перевірки для Y-стовпця
    if ((selectedChartType === 'bar' || selectedChartType === 'line') && !selectedYColumn && selectedAggregation !== 'count') {
      setError('Для стовпчикової/лінійної діаграми оберіть стовпець для осі Y або тип агрегації "Кількість".');
      return;
    }
    if (selectedChartType === 'pie' && selectedAggregation === 'sum' && !selectedYColumn) {
      setError('Для кругової діаграми з агрегацією "Сума" оберіть стовпець для значень (Y).');
      return;
    }

    setIsProcessingChart(true);
    setError('');
    setChartData(null);

    const payload = {
      x_column: selectedXColumn,
      y_column: selectedYColumn || null, 
      chart_type: selectedChartType,
      aggregation_type: selectedAggregation || null,
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/process`, payload);
      const { labels, values, x_column_processed, y_column_processed } = response.data;

      if (!labels || !values || labels.length === 0 || values.length === 0) {
        setError("Отримано порожні дані для графіка. Можливо, обрані стовпці або фільтри не дали результатів.");
        setChartData(null);
        setIsProcessingChart(false);
        return;
      }

      const newChartData = {
        labels: labels,
        datasets: [
          {
            label: `${y_column_processed || 'Значення'} по ${x_column_processed}`,
            data: values,
            backgroundColor: selectedChartType === 'pie' 
              ? generateColors(values.length) 
              : (selectedChartType === 'line' ? 'rgba(75, 192, 192, 0.6)' : 'rgba(54, 162, 235, 0.6)'),
            borderColor: selectedChartType === 'pie' 
              ? generateColors(values.length, 1)
              : (selectedChartType === 'line' ? 'rgba(75, 192, 192, 1)' : 'rgba(54, 162, 235, 1)'),
            borderWidth: 1,
            fill: selectedChartType === 'line' ? false : undefined,
            tension: selectedChartType === 'line' ? 0.1 : undefined,
          },
        ],
      };
      setChartData(newChartData);
    } catch (err) {
      handleApiError(err, 'побудови графіка');
    } finally {
      setIsProcessingChart(false);
    }
  };

  const generateColors = (numColors, alpha = 0.7) => {
    const baseColors = [
        `rgba(255, 99, 132, ${alpha})`, `rgba(54, 162, 235, ${alpha})`, `rgba(255, 206, 86, ${alpha})`,
        `rgba(75, 192, 192, ${alpha})`, `rgba(153, 102, 255, ${alpha})`, `rgba(255, 159, 64, ${alpha})`,
        `rgba(199, 199, 199, ${alpha})`, `rgba(83, 102, 255, ${alpha})`, `rgba(40, 159, 64, ${alpha})`,
        `rgba(210, 99, 132, ${alpha})`
    ];
    const colors = [];
    for (let i = 0; i < numColors; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      title: { display: true, text: `Тип графіка: ${selectedChartType.charAt(0).toUpperCase() + selectedChartType.slice(1)}` },
    },
    scales: (selectedChartType === 'bar' || selectedChartType === 'line') ? {
      y: { beginAtZero: true, title: { display: true, text: selectedYColumn || (selectedAggregation === 'count' ? 'Кількість' : 'Значення') } },
      x: { title: { display: true, text: selectedXColumn || 'Категорії' } },
    } : {}, // Порожній об'єкт для Pie, щоб не було помилок
  };

  const renderChart = () => {
    if (!chartData) return null;
    const key = `${selectedChartType}-${selectedXColumn}-${selectedYColumn}-${selectedAggregation}`; // Унікальний ключ для перерендеру
    switch (selectedChartType) {
      case 'bar': return <Bar key={key} data={chartData} options={chartOptions} />;
      case 'line': return <Line key={key} data={chartData} options={chartOptions} />;
      case 'pie': return <Pie key={key} data={chartData} options={chartOptions} />;
      default: return null;
    }
  };
  
  const yColumnRequired = (selectedChartType === 'bar' || selectedChartType === 'line') && selectedAggregation !== 'count';
  const yColumnRelevantForPieSum = selectedChartType === 'pie' && selectedAggregation === 'sum';


  return (
    <div className="App">
      <header className="App-header">
        <h1>CSV Візуалізатор Проекту</h1>
      </header>
      <main>
        <div className="controls">
          <div>
            <label htmlFor="csvFile">1. Завантажте CSV файл:</label>
            <input type="file" id="csvFile" accept=".csv" onChange={(e) => setFile(e.target.files[0])} />
            {fileName && !isLoadingFile && <p className="file-name-display">Обраний файл: {fileName}</p>}
          </div>

          {isLoadingFile && (
            <div className="loader-container">
              <div className="loader"></div>
              <p className="loading-text">Завантаження файлу...</p>
            </div>
          )}
          
          {headers.length > 0 && !isLoadingFile && (
            <>
              <div>
                <label htmlFor="chartTypeSelect">2. Оберіть тип графіка:</label>
                <select id="chartTypeSelect" value={selectedChartType} onChange={(e) => {
                    setSelectedChartType(e.target.value); 
                    setChartData(null); 
                    setSelectedYColumn(''); // Скидаємо Y, щоб користувач переобрав якщо потрібно
                    setSelectedAggregation(''); // Скидаємо агрегацію
                }}>
                  <option value="bar">Стовпчикова</option>
                  <option value="line">Лінійна</option>
                  <option value="pie">Кругова</option>
                </select>
              </div>

              <div>
                <label htmlFor="xAxisSelect">3. Оберіть стовпець для осі X / Категорій:</label>
                <select id="xAxisSelect" value={selectedXColumn} onChange={(e) => {setSelectedXColumn(e.target.value); setChartData(null);}}>
                  <option value="" disabled>-- Оберіть стовпець --</option>
                  {headers.map((h) => (<option key={h} value={h}>{h}</option>))}
                </select>
              </div>
              
              <div>
                <label htmlFor="yAxisSelect">
                    4. Оберіть стовпець для осі Y / Значень 
                    {selectedChartType === 'pie' && selectedAggregation === 'count' ? " (не потрібно для Pie/Count)" : 
                     selectedChartType === 'pie' && !selectedAggregation ? " (або оберіть агрегацію)" : ""}
                </label>
                <select 
                  id="yAxisSelect" 
                  value={selectedYColumn} 
                  onChange={(e) => {setSelectedYColumn(e.target.value); setChartData(null);}}
                  disabled={selectedChartType === 'pie' && selectedAggregation === 'count'}
                >
                  <option value="">
                    {selectedChartType === 'pie' && selectedAggregation === 'count' ? "-- Не використовується --" : 
                     (selectedChartType === 'pie' && selectedAggregation !== 'sum') ? "-- Оберіть для Sum або залиште для Count --" : 
                     "-- Оберіть стовпець --"
                    }
                  </option>
                  {headers.map((h) => (<option key={h} value={h}>{h}</option>))}
                </select>
              </div>

              <div>
                <label htmlFor="aggregationSelect">5. Оберіть тип агрегації (якщо потрібно):</label>
                <select 
                  id="aggregationSelect" 
                  value={selectedAggregation} 
                  onChange={(e) => {setSelectedAggregation(e.target.value); setChartData(null); if (e.target.value === 'count' && selectedChartType === 'pie') setSelectedYColumn('');}}
                >
                  <option value="">Без агрегації</option>
                  <option value="sum">Сума (Sum)</option>
                  <option value="count">Кількість (Count)</option>
                </select>
              </div>
             
              <div>
                <button 
                    onClick={handleBuildChart} 
                    disabled={
                        isProcessingChart || 
                        !selectedXColumn ||
                        (yColumnRequired && !selectedYColumn) ||
                        (yColumnRelevantForPieSum && !selectedYColumn)
                    }
                >
                  {isProcessingChart ? 'Обробка...' : 'Побудувати графік'}
                </button>
              </div>
            </>
          )}

          {error && !isLoadingFile && !isProcessingChart && <p className="error-message">{error}</p>}
        </div>

        {chartData && !isProcessingChart && !error && (
          <div className="chart-container" style={{ position: 'relative', height: '500px', width: '90vw', maxWidth: '1000px', margin: '20px auto' }}>
            {renderChart()}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;