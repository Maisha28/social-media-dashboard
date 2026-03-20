'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [connectionTest, setConnectionTest] = useState<any>(null);
  const [directFetchTest, setDirectFetchTest] = useState<any>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    addLog('Starting Supabase diagnostics...');
    
    // Test 1: Check Supabase client
    addLog('1. Checking Supabase client...');
    
    // Instead of accessing supabase.supabaseUrl directly, we'll test it differently
    addLog(`Supabase URL from .env: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    
    // Test 2: Try to fetch from posts table
    addLog('2. Attempting to fetch from "posts" table...');
    try {
      const { data, error, status } = await supabase
        .from('posts')
        .select('*')
        .limit(1);
      
      setConnectionTest({ data, error, status });
      
      if (error) {
        addLog(`❌ Supabase error: ${error.message} (code: ${error.code})`);
        addLog(`Error details: ${JSON.stringify(error)}`);
      } else {
        addLog(`✅ Supabase fetch successful! Status: ${status}`);
        addLog(`Found ${data?.length || 0} records`);
      }
    } catch (error: any) {
      addLog(`❌ Exception caught: ${error.message}`);
      console.error('Exception:', error);
    }

    // Test 3: Direct fetch to check CORS/network
    addLog('3. Testing direct fetch to Supabase REST API...');
    try {
      const response = await fetch(
        'https://tkcouzqipyjaypdyasew.supabase.co/rest/v1/posts?select=*&limit=1',
        {
          headers: {
            'apikey': 'sb_publishable_9gZKPywdVj7xjUOlb8ZRVg_OgzAchRY',
            'Authorization': `Bearer sb_publishable_9gZKPywdVj7xjUOlb8ZRVg_OgzAchRY`
          }
        }
      );
      
      const data = await response.json();
      setDirectFetchTest({ status: response.status, ok: response.ok, data });
      
      if (response.ok) {
        addLog(`✅ Direct fetch successful! Status: ${response.status}`);
      } else {
        addLog(`❌ Direct fetch failed: ${response.status} ${response.statusText}`);
        addLog(`Response: ${JSON.stringify(data)}`);
      }
    } catch (error: any) {
      addLog(`❌ Direct fetch exception: ${error.message}`);
    }

    // Test 4: Check environment
    addLog('4. Checking environment...');
    addLog(`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
    addLog(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing'}`);

    addLog('Diagnostics complete!');
  };

  const copyLogs = () => {
    const logText = logs.join('\n');
    navigator.clipboard.writeText(logText);
    alert('Logs copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Supabase Debug Console</h1>
        <p className="text-gray-400 mb-6">Diagnosing connection issues to: tkcouzqipyjaypdyasew.supabase.co</p>

        {/* Logs */}
        <div className="bg-black rounded-xl p-6 mb-8 font-mono">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Diagnostic Logs</h2>
            <button
              onClick={copyLogs}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
            >
              📋 Copy Logs
            </button>
          </div>
          <div className="h-96 overflow-y-auto bg-gray-900 p-4 rounded">
            {logs.map((log, index) => (
              <div key={index} className="mb-2 text-sm">
                <span className="text-gray-400">{log}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Test Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Supabase Client Test */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Supabase Client Test</h2>
            {connectionTest ? (
              <div className={`p-4 rounded-lg ${connectionTest.error ? 'bg-red-900/30 border border-red-700' : 'bg-green-900/30 border border-green-700'}`}>
                <div className="flex items-center mb-2">
                  <span className={`text-2xl mr-2 ${connectionTest.error ? 'text-red-400' : 'text-green-400'}`}>
                    {connectionTest.error ? '❌' : '✅'}
                  </span>
                  <span className="font-medium">
                    {connectionTest.error ? 'Failed' : 'Success'}
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  <div>Status: <code>{connectionTest.status}</code></div>
                  {connectionTest.error && (
                    <>
                      <div>Error: <code>{connectionTest.error.message}</code></div>
                      <div>Code: <code>{connectionTest.error.code}</code></div>
                    </>
                  )}
                  <div>Records: {connectionTest.data?.length || 0}</div>
                </div>
              </div>
            ) : (
              <div className="text-gray-400 text-center py-8">Running test...</div>
            )}
          </div>

          {/* Direct Fetch Test */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Direct API Test</h2>
            {directFetchTest ? (
              <div className={`p-4 rounded-lg ${directFetchTest.ok ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
                <div className="flex items-center mb-2">
                  <span className={`text-2xl mr-2 ${directFetchTest.ok ? 'text-green-400' : 'text-red-400'}`}>
                    {directFetchTest.ok ? '✅' : '❌'}
                  </span>
                  <span className="font-medium">
                    {directFetchTest.ok ? 'Success' : 'Failed'}
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  <div>Status: <code>{directFetchTest.status}</code></div>
                  <div>OK: <code>{directFetchTest.ok.toString()}</code></div>
                  <div>Data: {JSON.stringify(directFetchTest.data).substring(0, 100)}...</div>
                </div>
              </div>
            ) : (
              <div className="text-gray-400 text-center py-8">Running test...</div>
            )}
          </div>
        </div>

        {/* Common Fixes */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Common Solutions</h2>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg">
              <h3 className="font-medium text-yellow-300 mb-2">1. Check Your URL</h3>
              <p className="text-sm text-gray-300">
                Your Supabase URL: <code className="bg-gray-700 px-2 py-1 rounded">tkcouzqipyjaypdyasew</code>
                <br/>
                Using: <code className="bg-gray-700 px-2 py-1 rounded">https://tkcouzqipyjaypdyasew.supabase.co</code>
              </p>
            </div>

            <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
              <h3 className="font-medium text-blue-300 mb-2">2. Restart Development Server</h3>
              <p className="text-sm text-gray-300">
                After changing environment variables, restart the server:
                <code className="block bg-gray-700 px-3 py-2 rounded mt-2 font-mono">Ctrl+C → npm run dev</code>
              </p>
            </div>

            <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg">
              <h3 className="font-medium text-green-300 mb-2">3. Check RLS Policies</h3>
              <p className="text-sm text-gray-300">
                Go to: <a href="https://supabase.com/dashboard/project/tkcouzqipyjaypdyasew/editor" target="_blank" className="text-blue-400 hover:underline">Supabase Table Editor → posts table → RLS Policies</a>
                <br/>
                Add policy: "Allow public read access" with expression: <code className="bg-gray-700 px-1 rounded">true</code>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <button
            onClick={runDiagnostics}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 py-3 rounded-lg font-medium"
          >
            🔄 Run Diagnostics Again
          </button>
          <a
            href="https://tkcouzqipyjaypdyasew.supabase.co"
            target="_blank"
            className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-medium text-center"
          >
            🔗 Open Supabase Dashboard
          </a>
          <a
            href="/content"
            className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-lg font-medium text-center"
          >
            📱 Try Content Page Again
          </a>
        </div>
      </div>
    </div>
  );
}