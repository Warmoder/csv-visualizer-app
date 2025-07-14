import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import './App.css'; // Переконайтесь, що цей файл існує

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend
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

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme); // Встановлюємо атрибут на <html>
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    if (!file) return;
    // ... (логіка uploadFile залишається такою ж, як у вашому останньому варіанті) ...
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
    // ... (логіка handleApiError залишається такою ж) ...
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
    // ... (логіка handleBuildChart залишається такою ж) ...
    if (!selectedXColumn) {
      setError('Будь ласка, оберіть стовпець для осі X / Категорій.');
      return;
    }
    const yColumnRequiredForType = (selectedChartType === 'bar' || selectedChartType === 'line');
    const aggregationAllowsNoY = selectedAggregation === 'count';
    const pieSumRequiresY = selectedChartType === 'pie' && selectedAggregation === 'sum';

    if (yColumnRequiredForType && !aggregationAllowsNoY && !selectedYColumn) {
      setError('Для цього типу графіка та агрегації оберіть стовпець для осі Y.');
      return;
    }
    if (pieSumRequiresY && !selectedYColumn) {
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
              : (selectedChartType === 'line' ? 'rgba(var(--chart-line-rgb), 0.6)' : 'rgba(var(--chart-bar-rgb), 0.6)'), // Використання CSS змінних для кольорів
            borderColor: selectedChartType === 'pie' 
              ? generateColors(values.length, 1)
              : (selectedChartType === 'line' ? 'rgb(var(--chart-line-rgb))' : 'rgb(var(--chart-bar-rgb))'),
            borderWidth: selectedChartType === 'pie' ? 1 : 2, // Трохи товща рамка для ліній та стовпців
            fill: selectedChartType === 'line' ? false : undefined,
            tension: selectedChartType === 'line' ? 0.3 : undefined, // Більш плавна лінія
            pointBackgroundColor: selectedChartType === 'line' ? 'rgb(var(--chart-line-rgb))' : undefined, // Колір точок на лінії
            pointRadius: selectedChartType === 'line' ? 4 : undefined,
            pointHoverRadius: selectedChartType === 'line' ? 6 : undefined,
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

  const generateColors = (numColors) => {
    // Покращена генерація кольорів для Pie chart
    const baseHues = [0, 210, 40, 280, 160, 60]; // Hues for red, blue, yellow, purple, cyan, orange
    const colors = [];
    for (let i = 0; i < numColors; i++) {
      const hue = baseHues[i % baseHues.length];
      const saturation = 70 + Math.random() * 10; // 70-80%
      const lightness = 55 + Math.random() * 10; // 55-65%
      colors.push(`hsla(${hue}, ${saturation}%, ${lightness}%, 0.7)`);
    }
    return colors;
  };
  
  // Динамічне отримання кольорів для Chart.js з CSS змінних
  const getChartColors = () => {
    const style = getComputedStyle(document.documentElement);
    return {
      textColor: style.getPropertyValue('--chart-text-color').trim(),
      gridColor: style.getPropertyValue('--chart-grid-color').trim(),
      // Для backgroundColor та borderColor, ми використовуємо RGB значення, які визначимо в CSS
    };
  };
  
    const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true, 
        position: 'top',
        labels: { color: getChartColors().textColor, font: { size: 13 } }
      },
      title: { 
        display: true, 
        text: `Тип графіка: ${selectedChartType.charAt(0).toUpperCase() + selectedChartType.slice(1)}`,
        color: getChartColors().textColor,
        font: { size: 16, weight: '600' }
      },
      tooltip: { // Починаємо налаштування тултипів
        backgroundColor: `rgba(${getComputedStyle(document.documentElement).getPropertyValue('--tooltip-bg-rgb').trim()}, 0.9)`,
        titleColor: `rgb(${getComputedStyle(document.documentElement).getPropertyValue('--tooltip-text-rgb').trim()})`,
        bodyColor: `rgb(${getComputedStyle(document.documentElement).getPropertyValue('--tooltip-text-rgb').trim()})`,
        borderColor: `rgb(${getComputedStyle(document.documentElement).getPropertyValue('--tooltip-border-rgb').trim()})`,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 4,
        callbacks: { // Додаємо або модифікуємо колбеки
          label: function(context) {
            let label = context.dataset.label || ''; // Наприклад, "Населення по Місто"
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              // context.label - це мітка сегмента (наприклад, "Київ")
              // context.raw - це сире значення для цього сегмента (наприклад, населення)
              // context.formattedValue - відформатоване значення
              if (selectedChartType === 'pie' || selectedChartType === 'doughnut') { // Специфічно для кругових
                label = context.label + ': ' + context.formattedValue;
              } else { // Для інших типів графіків (bar, line)
                label += context.formattedValue;
              }
            }
            return label;
          }
        }
      }
    },
    scales: (selectedChartType === 'bar' || selectedChartType === 'line') ? {
      y: { 
        beginAtZero: true, 
        title: { display: true, text: selectedYColumn || (selectedAggregation === 'count' ? 'Кількість' : 'Значення'), color: getChartColors().textColor, font: {size: 14} },
        ticks: { color: getChartColors().textColor, font: {size: 12} }, 
        grid: { color: getChartColors().gridColor, drawBorder: false } 
      },
      x: { 
        title: { display: true, text: selectedXColumn || 'Категорії', color: getChartColors().textColor, font: {size: 14} },
        ticks: { color: getChartColors().textColor, font: {size: 12} }, 
        grid: { display: false } // Забираємо вертикальну сітку для чистоти
      },
    } : {},
  };

  const renderChart = () => {
    if (!chartData) return null;
    const key = `${selectedChartType}-${selectedXColumn}-${selectedYColumn}-${selectedAggregation}-${theme}`; 
    // Оновлюємо dataset кольори перед рендером, якщо вони залежать від теми
    const updatedChartData = {
        ...chartData,
        datasets: chartData.datasets.map(dataset => ({
            ...dataset,
            backgroundColor: selectedChartType === 'pie' 
              ? generateColors(dataset.data.length) 
              : (selectedChartType === 'line' ? `rgba(${getComputedStyle(document.documentElement).getPropertyValue('--chart-line-rgb').trim()}, 0.4)` : `rgba(${getComputedStyle(document.documentElement).getPropertyValue('--chart-bar-rgb').trim()}, 0.7)`),
            borderColor: selectedChartType === 'pie' 
              ? generateColors(dataset.data.length, 1).map(c => c.replace('0.7', '1')) // Для Pie border має бути непрозорим
              : (selectedChartType === 'line' ? `rgb(${getComputedStyle(document.documentElement).getPropertyValue('--chart-line-rgb').trim()})` : `rgb(${getComputedStyle(document.documentElement).getPropertyValue('--chart-bar-rgb').trim()})`),
            pointBackgroundColor: selectedChartType === 'line' ? `rgb(${getComputedStyle(document.documentElement).getPropertyValue('--chart-line-rgb').trim()})` : undefined,
        }))
    };

    switch (selectedChartType) {
      case 'bar': return <Bar key={key} data={updatedChartData} options={chartOptions} />;
      case 'line': return <Line key={key} data={updatedChartData} options={chartOptions} />;
      case 'pie': return <Pie key={key} data={updatedChartData} options={chartOptions} />;
      default: return null;
    }
  };
  
  const yColumnIsEffectivelyDisabled = selectedChartType === 'pie' && selectedAggregation === 'count';
  const aggregationIsRelevant = selectedChartType === 'pie' || ((selectedChartType === 'bar' || selectedChartType === 'line') && selectedXColumn);

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
            <svg className="header-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="32px" height="32px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 12.5H8V14h2v1.5zm0-2.5H8V10h2v1.5zm0-2.5H8V7.5h2V10zm4.5 5H12V14h2.5v1.5zm0-2.5H12V10h2.5v1.5zm0-2.5H12V7.5h2.5V10zm2.5 5h-2V14h2v1.5zm0-2.5h-2V10h2v1.5z"/></svg>
            <h1>CSV Візуалізатор</h1>
        </div>
        <button onClick={toggleTheme} className="theme-toggle-button" title={theme === 'light' ? 'Темна тема' : 'Світла тема'}>
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </header>
      <main className="App-main">
        <section className="controls-section card">
          <h2 className="section-title">Налаштування візуалізації</h2>
          <div className="control-group">
            <label htmlFor="csvFile" className="control-label">1. Завантажте CSV файл:</label>
            <input type="file" id="csvFile" className="file-input" accept=".csv" onChange={(e) => setFile(e.target.files[0])} />
            {fileName && !isLoadingFile && <p className="file-name-display">Обрано: <strong>{fileName}</strong></p>}
          </div>

          {isLoadingFile && (
            <div className="loader-container">
              <div className="loader"></div>
              <p className="loading-text">Обробка файлу...</p>
            </div>
          )}
          
          {headers.length > 0 && !isLoadingFile && (
            <>
              <div className="control-group">
                <label htmlFor="chartTypeSelect" className="control-label">2. Тип графіка:</label>
                <select id="chartTypeSelect" className="select-input" value={selectedChartType} onChange={(e) => {
                    setSelectedChartType(e.target.value); 
                    setChartData(null); 
                    setSelectedYColumn('');
                    setSelectedAggregation('');
                }}>
                  <option value="bar">Стовпчикова</option>
                  <option value="line">Лінійна</option>
                  <option value="pie">Кругова</option>
                </select>
              </div>

              <div className="control-group">
                <label htmlFor="xAxisSelect" className="control-label">3. Вісь X / Категорії:</label>
                <select id="xAxisSelect" className="select-input" value={selectedXColumn} onChange={(e) => {setSelectedXColumn(e.target.value); setChartData(null);}}>
                  <option value="" disabled>-- Оберіть --</option>
                  {headers.map((h) => (<option key={h} value={h}>{h}</option>))}
                </select>
              </div>
              
              <div className="control-group">
                <label htmlFor="yAxisSelect" className="control-label">
                    4. Вісь Y / Значення
                    {yColumnIsEffectivelyDisabled ? " (не потрібно для Кількість/Pie)" : ""}
                </label>
                <select 
                  id="yAxisSelect" 
                  className="select-input"
                  value={selectedYColumn} 
                  onChange={(e) => {setSelectedYColumn(e.target.value); setChartData(null);}}
                  disabled={yColumnIsEffectivelyDisabled}
                >
                  <option value="">
                    {yColumnIsEffectivelyDisabled ? "-- Не використовується --" : 
                     (selectedChartType === 'pie' && selectedAggregation !== 'sum') ? "-- Для Sum або залиште для Count --" : 
                     "-- Оберіть --"
                    }
                  </option>
                  {headers.map((h) => (<option key={h} value={h}>{h}</option>))}
                </select>
              </div>

              {aggregationIsRelevant && (
                 <div className="control-group">
                  <label htmlFor="aggregationSelect" className="control-label">5. Тип агрегації:</label>
                  <select 
                    id="aggregationSelect" 
                    className="select-input"
                    value={selectedAggregation} 
                    onChange={(e) => {
                        setSelectedAggregation(e.target.value); 
                        setChartData(null); 
                        if (e.target.value === 'count' && selectedChartType === 'pie') {
                            setSelectedYColumn('');
                        }
                    }}
                  >
                    <option value="">Без агрегації</option>
                    <option value="sum">Сума</option>
                    <option value="count">Кількість</option>
                  </select>
                </div>
              )}
             
              <div className="control-group">
                <button 
                    className="button-primary"
                    onClick={handleBuildChart} 
                    disabled={
                        isProcessingChart || 
                        !selectedXColumn ||
                        ( (selectedChartType === 'bar' || selectedChartType === 'line') && !selectedYColumn && selectedAggregation !== 'count' ) ||
                        ( selectedChartType === 'pie' && selectedAggregation === 'sum' && !selectedYColumn )
                    }
                >
                  {isProcessingChart ? (
                    <div className="loader-container button-loader-container">
                        <div className="loader button-loader"></div>Обробка...
                    </div>
                  ) : 'Побудувати графік'}
                </button>
              </div>
            </>
          )}
          {error && !isLoadingFile && !isProcessingChart && <div className="error-message card">{error}</div>}
        </section>

        {chartData && !isProcessingChart && !error && (
          <section className="chart-section card">
            <div className="chart-wrapper" style={{ position: 'relative', height: '450px' /* Змінено висоту */ }}>
              {renderChart()}
            </div>
          </section>
        )}
      </main>
       <footer className="App-footer">
        <p>© {new Date().getFullYear()} CSV Visualizer. Created by petuxi.</p>
      </footer>
    </div>
  );
}

export default App;
