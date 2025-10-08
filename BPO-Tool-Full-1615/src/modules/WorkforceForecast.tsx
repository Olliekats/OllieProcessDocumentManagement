import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Users, AlertTriangle, Activity, BarChart3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DemandForecast {
  id: string;
  forecast_date: string;
  interval_start: string;
  interval_end: string;
  channel: string;
  predicted_volume: number;
  predicted_aht: number;
  confidence_level: number;
}

interface SeasonalityPattern {
  id: string;
  pattern_name: string;
  pattern_type: string;
  multiplier: number;
  is_active: boolean;
}

export default function WorkforceForecast() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [forecasts, setForecasts] = useState<DemandForecast[]>([]);
  const [patterns, setPatterns] = useState<SeasonalityPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForecast, setShowNewForecast] = useState(false);

  const [newForecast, setNewForecast] = useState({
    forecast_date: new Date().toISOString().split('T')[0],
    interval_start: '09:00',
    interval_end: '09:30',
    channel: 'all' as 'voice' | 'chat' | 'email' | 'all',
    predicted_volume: 100,
    predicted_aht: 5.0,
    confidence_level: 80,
  });

  useEffect(() => {
    loadForecasts();
    loadPatterns();
  }, [selectedDate]);

  const loadForecasts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('demand_forecasts')
      .select('*')
      .eq('forecast_date', selectedDate)
      .order('interval_start');

    if (!error && data) {
      setForecasts(data);
    }
    setLoading(false);
  };

  const loadPatterns = async () => {
    const { data, error } = await supabase
      .from('seasonality_patterns')
      .select('*')
      .eq('is_active', true)
      .order('pattern_name');

    if (!error && data) {
      setPatterns(data);
    }
  };

  const handleCreateForecast = async () => {
    if (!user) return;

    const { error } = await supabase.from('demand_forecasts').insert({
      ...newForecast,
      created_by: user.id,
    });

    if (!error) {
      loadForecasts();
      setShowNewForecast(false);
      setNewForecast({
        forecast_date: new Date().toISOString().split('T')[0],
        interval_start: '09:00',
        interval_end: '09:30',
        channel: 'all',
        predicted_volume: 100,
        predicted_aht: 5.0,
        confidence_level: 80,
      });
    }
  };

  const calculateRequiredAgents = (volume: number, aht: number) => {
    const trafficIntensity = (volume * aht) / 30;
    return Math.ceil(trafficIntensity * 1.2);
  };

  const getTotalPredictedVolume = () => {
    return forecasts.reduce((sum, f) => sum + f.predicted_volume, 0);
  };

  const getAverageAHT = () => {
    if (forecasts.length === 0) return 0;
    return forecasts.reduce((sum, f) => sum + f.predicted_aht, 0) / forecasts.length;
  };

  const getPeakInterval = () => {
    if (forecasts.length === 0) return null;
    return forecasts.reduce((max, f) => f.predicted_volume > max.predicted_volume ? f : max);
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'voice': return 'bg-blue-100 text-blue-700';
      case 'chat': return 'bg-green-100 text-green-700';
      case 'email': return 'bg-purple-100 text-purple-700';
      case 'all': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const peakInterval = getPeakInterval();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Workforce Forecasting</h2>
          <p className="text-gray-600 mt-1">Predict demand and optimize staffing</p>
        </div>
        <TrendingUp className="w-8 h-8 text-blue-600" />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-6 h-6 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{getTotalPredictedVolume()}</div>
          <div className="text-sm opacity-90">Predicted Volume</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-6 h-6 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">
            {forecasts.length > 0 ? calculateRequiredAgents(getTotalPredictedVolume() / forecasts.length, getAverageAHT()) : 0}
          </div>
          <div className="text-sm opacity-90">Recommended Agents</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-6 h-6 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{getAverageAHT().toFixed(1)}m</div>
          <div className="text-sm opacity-90">Average AHT</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-6 h-6 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{peakInterval?.predicted_volume || 0}</div>
          <div className="text-sm opacity-90">Peak Volume</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Demand Forecast</h3>
                <p className="text-sm text-gray-600">30-minute intervals</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => setShowNewForecast(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Interval
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading forecasts...</div>
            ) : forecasts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <div>No forecasts for this date</div>
                <button
                  onClick={() => setShowNewForecast(true)}
                  className="mt-3 text-blue-600 hover:text-blue-700"
                >
                  Create your first forecast
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Time</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Channel</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Volume</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">AHT</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Agents</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecasts.map((forecast) => (
                      <tr key={forecast.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {forecast.interval_start} - {forecast.interval_end}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${getChannelColor(forecast.channel)}`}>
                            {forecast.channel}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                          {forecast.predicted_volume}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {forecast.predicted_aht.toFixed(1)}m
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-blue-600">
                          {calculateRequiredAgents(forecast.predicted_volume, forecast.predicted_aht)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${forecast.confidence_level}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">{forecast.confidence_level}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {peakInterval && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-orange-900 mb-1">Peak Period Identified</div>
                  <div className="text-sm text-orange-800">
                    Highest volume expected between {peakInterval.interval_start} - {peakInterval.interval_end} with{' '}
                    <strong>{peakInterval.predicted_volume} interactions</strong>. Recommend{' '}
                    <strong>{calculateRequiredAgents(peakInterval.predicted_volume, peakInterval.predicted_aht)} agents</strong>{' '}
                    for this interval.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Seasonality Patterns</h3>

            {patterns.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">No active patterns</div>
            ) : (
              <div className="space-y-3">
                {patterns.map((pattern) => (
                  <div key={pattern.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-gray-900 text-sm">{pattern.pattern_name}</div>
                      <div className={`px-2 py-0.5 rounded text-xs ${
                        pattern.multiplier > 1 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {pattern.multiplier > 1 ? '+' : ''}{((pattern.multiplier - 1) * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 capitalize">{pattern.pattern_type}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-semibold text-blue-900 mb-1 text-sm">Forecasting Tips</div>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Use historical data for accuracy</li>
                  <li>• Account for seasonality</li>
                  <li>• Review and adjust regularly</li>
                  <li>• Include buffer for uncertainty</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showNewForecast && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">New Forecast Interval</h3>
                <button
                  onClick={() => setShowNewForecast(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={newForecast.forecast_date}
                  onChange={(e) => setNewForecast({ ...newForecast, forecast_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newForecast.interval_start}
                    onChange={(e) => setNewForecast({ ...newForecast, interval_start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={newForecast.interval_end}
                    onChange={(e) => setNewForecast({ ...newForecast, interval_end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                <select
                  value={newForecast.channel}
                  onChange={(e) => setNewForecast({ ...newForecast, channel: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Channels</option>
                  <option value="voice">Voice</option>
                  <option value="chat">Chat</option>
                  <option value="email">Email</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Predicted Volume</label>
                  <input
                    type="number"
                    value={newForecast.predicted_volume}
                    onChange={(e) => setNewForecast({ ...newForecast, predicted_volume: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">AHT (minutes)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newForecast.predicted_aht}
                    onChange={(e) => setNewForecast({ ...newForecast, predicted_aht: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confidence Level (%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newForecast.confidence_level}
                  onChange={(e) => setNewForecast({ ...newForecast, confidence_level: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-sm text-gray-600 text-center">{newForecast.confidence_level}%</div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowNewForecast(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateForecast}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Forecast
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
