"use client";

import React from 'react';

interface PdfGeneratorProps {
  data?:{
    totalPosts?: number;
    totalLikes?: number;
    totalComments?: number;
    avgEngagement?: number;
    platforms?: Array<{ name: string; count: number }>;
  };
  title?: string;
}

const PdfGenerator: React.FC<PdfGeneratorProps> = ({
  data,
  title = "Social Analytics Report"
}) => {
  const generatePDF = () => {
    // Create a simple PDF using window.print()
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      alert('Please allow popups to generate PDF');
      return;
    }
    
    // Write the content
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 30px; 
              max-width: 800px;
              margin: 0 auto;
            }
            h1 { 
              color: #1f2937; 
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 10px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin: 20px 0;
            }
            .stat-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 15px;
            }
            .stat-label {
              font-size: 12px;
              color: #64748b;
              margin-bottom: 5px;
            }
            .stat-value {
              font-size: 20px;
              font-weight: bold;
              color: #1e293b;
            }
            table { 
              border-collapse: collapse; 
              width: 100%; 
              margin: 20px 0;
              border: 1px solid #e2e8f0;
            }
            th, td { 
              border: 1px solid #e2e8f0; 
              padding: 10px; 
              text-align: left; 
            }
            th { 
              background-color: #f1f5f9; 
              font-weight: 600;
            }
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #e2e8f0;
              font-size: 12px;
              color: #64748b;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p><strong>Generated on:</strong> ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
          
          <h2>Dashboard Summary</h2>
          <div class="summary-grid">
            <div class="stat-card">
              <div class="stat-label">Total Posts</div>
              <div class="stat-value">${data?.totalPosts || 21}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Likes</div>
              <div class="stat-value">${(data?.totalLikes || 60150).toLocaleString()}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Comments</div>
              <div class="stat-value">${(data?.totalComments || 12250).toLocaleString()}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Average Engagement</div>
              <div class="stat-value">${data?.avgEngagement || 80.4}%</div>
            </div>
          </div>
          
          <h2>Platform Distribution</h2>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
            ${(data?.platforms || [
              { name: 'Instagram', count: 6 },
              { name: 'LinkedIn', count: 5 },
              { name: 'Facebook', count: 5 },
              { name: 'Twitter', count: 5 }
            ]).map(platform => `
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                <span>${platform.name}</span>
                <span style="font-weight: bold;">${platform.count} posts</span>
              </div>
            `).join('')}
          </div>
          
          <h2>Top Performing Posts</h2>
          <table>
            <thead>
              <tr>
                <th>Post</th>
                <th>Platform</th>
                <th>Likes</th>
                <th>Comments</th>
                <th>Engagement %</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Year End Report</td>
                <td>LinkedIn</td>
                <td>3,400</td>
                <td>780</td>
                <td style="color: #10b981; font-weight: bold;">98.2%</td>
              </tr>
              <tr>
                <td>Star exec hackathon</td>
                <td>Instagram</td>
                <td>300</td>
                <td>20</td>
                <td style="color: #f59e0b; font-weight: bold;">56.6%</td>
              </tr>
              <tr>
                <td>Quarterly Review</td>
                <td>Facebook</td>
                <td>1,200</td>
                <td>45</td>
                <td style="color: #3b82f6; font-weight: bold;">72.3%</td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer">
            <p><strong>Generated by Social Analytics Dashboard</strong></p>
            <p style="margin-top: 8px;">
              <strong>Engagement Calculation:</strong> Weighted formula: (Likes × 1) + (Comments × 2) + (Shares × 3)
            </p>
            <p style="margin-top: 8px;">
              <strong>Industry Benchmarks:</strong> Excellent (80-100%), Good (60-80%), Average (40-60%), Low (10-40%), Very Low (0-10%)
            </p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Give it a moment to render before printing
    setTimeout(() => {
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    }, 500);
  };

  return (
    <button
      onClick={generatePDF}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Download PDF Report
    </button>
  );
};

export default PdfGenerator;