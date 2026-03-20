'use client';

import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export default function DiagnosePage() {
  const [rawData, setRawData] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [tableInfo, setTableInfo] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('=== STARTING DIAGNOSTIC ===');
      
      // Test 1: Try with simple select
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select('*')
        .limit(10);

      console.log('Raw response:', { data, fetchError });
      
      if (fetchError) {
        console.error('Fetch error details:', fetchError);
        setError(fetchError);
      } else {
        console.log('Data received:', data);
        console.log('Data type:', typeof data);
        console.log('Data length:', data?.length);
        console.log('First item:', data?.[0]);
        
        setRawData(data);
        
        // Check what columns exist
        if (data && data.length > 0) {
          const columns = Object.keys(data[0]);
          console.log('Available columns:', columns);
          setTableInfo(`Columns: ${columns.join(', ')}`);
        }
      }
    } catch (err: any) {
      console.error('Catch error:', err);
      setError(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Data Diagnostic</h1>
        <p className="text-gray-600 mb-6">Checking what's actually coming from Supabase</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Raw Data */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Raw Data from Supabase</h2>
            
            {error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-medium text-red-700 mb-2">Error:</h3>
                <pre className="text-sm whitespace-pre-wrap">
                  {JSON.stringify(error, null, 2)}
                </pre>
              </div>
            ) : rawData ? (
              <div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Found <span className="font-bold">{rawData.length}</span> items
                  </p>
                  {tableInfo && (
                    <p className="text-sm text-gray-600 mt-1">{tableInfo}</p>
                  )}
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          {rawData[0] && Object.keys(rawData[0]).map((col) => (
                            <th key={col} className="px-4 py-2 text-left font-medium text-gray-700">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rawData.slice(0, 5).map((row: any, idx: number) => (
                          <tr key={idx} className="border-t">
                            {Object.values(row).map((value: any, colIdx) => (
                              <td key={colIdx} className="px-4 py-2 border-b">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading data...</p>
              </div>
            )}
          </div>

          {/* Right: Analysis */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Problem Analysis</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-medium text-yellow-700 mb-2">Issue: Empty Error Object</h3>
                <p className="text-sm text-gray-600">
                  The error <code className="bg-gray-100 px-1 rounded">{`{}`}</code> means:
                  <br/>1. Connection works (data arrives)
                  <br/>2. But JavaScript can't process it properly
                  <br/>3. Usually a <strong>column name mismatch</strong>
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-700 mb-2">Your Actual Table Structure</h3>
                <p className="text-sm text-gray-600">
                  From your Supabase screenshot:
                  <br/>• <code className="bg-gray-100 px-1">id</code> (int8, not UUID)
                  <br/>• <code className="bg-gray-100 px-1">title</code> (text)
                  <br/>• <code className="bg-gray-100 px-1">platform</code> (text)
                  <br/>• <code className="bg-gray-100 px-1">type</code> (text)
                  <br/>• Missing: likes, comments, shares, engagement
                </p>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-medium text-red-700 mb-2">What Your Code Expects</h3>
                <p className="text-sm text-gray-600">
                  Your content page code expects:
                  <br/>• <code className="bg-gray-100 px-1">likes</code> (integer)
                  <br/>• <code className="bg-gray-100 px-1">comments</code> (integer)
                  <br/>• <code className="bg-gray-100 px-1">shares</code> (integer)
                  <br/>• <code className="bg-gray-100 px-1">engagement</code> (decimal)
                  <br/>• <code className="bg-gray-100 px-1">posted_at</code> (date)
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={fetchData}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Solution Section */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Solution</h2>
          
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-green-600">1</span>
              </div>
              <div>
                <p className="font-medium">Update your posts table</p>
                <p className="text-sm text-gray-600">
                  Add missing columns: likes, comments, shares, engagement, posted_at
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-green-600">2</span>
              </div>
              <div>
                <p className="font-medium">Or update the content page</p>
                <p className="text-sm text-gray-600">
                  Modify code to work with your actual table structure
                </p>
              </div>
            </div>

            <div className="mt-4">
              <a
                href="https://tkcouzqipyjaypdyasew.supabase.co/table-editor"
                target="_blank"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Open Supabase Table Editor
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}