# WebSocket Integration - Usage Guide

## Overview
WebSocket has been successfully integrated into the microservice-reports application to provide real-time progress updates during report generation.

## Features
- Real-time progress updates during `processSimulationData` execution
- Error handling and notification via WebSocket
- Completion notifications with result data
- Session-based communication

## Client Usage

### 1. Connect to WebSocket
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling']
});
```

### 2. Join a Session
```javascript
const sessionId = 'unique-session-id';
socket.emit('join-session', sessionId);
```

### 3. Listen for Progress Updates
```javascript
socket.on('progress-update', (data) => {
  console.log(`Stage: ${data.stage}`);
  console.log(`Progress: ${data.progress}%`);
  console.log(`Message: ${data.message}`);
  
  // Update your UI accordingly
  updateProgressBar(data.progress);
  updateStatusMessage(data.message);
});
```

### 4. Listen for Errors
```javascript
socket.on('error', (errorData) => {
  console.error('Error:', errorData.error);
  console.error('Details:', errorData.details);
  
  // Handle error in UI
  showErrorMessage(errorData.error);
});
```

### 5. Listen for Completion
```javascript
socket.on('complete', (completeData) => {
  console.log('Report generation completed!');
  console.log('Result:', completeData.result);
  
  // Handle completion
  redirectToPDF(completeData.result.url);
});
```

## Server Integration

### Making API Request with Session ID
When calling the `processSimulationData` endpoint, include the session ID in headers:

```javascript
fetch('/api/reports/process-simulation', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Session-ID': sessionId,
    'X-API-Key': 'your-api-key'
  },
  body: JSON.stringify(simulationData)
});
```

## Progress Stages

The WebSocket will emit progress updates for the following stages:

1. **initializing** (0%) - Starting data processing
2. **generating_base_data** (5%) - Creating base configuration
3. **generating_cover** (10%) - Generating cover page
4. **processing_udea/unal/general** (15%) - Processing specific report type
5. **processing_competencies** (25%) - Processing competencies data
6. **processing_areas** (35%) - Processing areas data
7. **processing_students** (45%) - Processing student tables
8. **processing_difficulty** (55%) - Processing difficulty analysis
9. **generating_pages** (65%) - Generating individual pages
10. **generating_pdfs** (70%) - Starting PDF generation
11. **generating_pdf_page** (70-90%) - Individual PDF generation
12. **merging_pdfs** (90%) - Merging PDFs
13. **cleaning_up** (95%) - Cleanup temporary files
14. **completed** (100%) - Process finished

## Error Handling

Errors are automatically emitted via WebSocket with the following structure:
```javascript
{
  sessionId: 'session-id',
  error: 'Error message',
  details: { /* additional error details */ },
  timestamp: '2025-09-19T14:53:31.545Z'
}
```

## Complete Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>Report Generation with WebSocket</title>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
</head>
<body>
    <div>
        <progress id="progressBar" value="0" max="100"></progress>
        <p id="statusMessage">Ready</p>
        <button onclick="generateReport()">Generate Report</button>
    </div>

    <script>
        const socket = io('http://localhost:3001');
        const sessionId = `session_${Date.now()}`;
        
        socket.emit('join-session', sessionId);
        
        socket.on('progress-update', (data) => {
            document.getElementById('progressBar').value = data.progress;
            document.getElementById('statusMessage').textContent = data.message;
        });
        
        socket.on('error', (errorData) => {
            alert('Error: ' + errorData.error);
        });
        
        socket.on('complete', (completeData) => {
            alert('Report generated successfully!');
            window.open(completeData.result.url, '_blank');
        });
        
        function generateReport() {
            fetch('/api/reports/process-simulation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-ID': sessionId,
                    'X-API-Key': 'your-api-key'
                },
                body: JSON.stringify(simulationData)
            });
        }
    </script>
</body>
</html>
```

## Configuration

The WebSocket server is configured with:
- CORS support for the configured origin
- Support for both WebSocket and polling transports
- Automatic session management
- Graceful shutdown handling

## Notes

- Session IDs should be unique for each report generation request
- The WebSocket connection will persist until manually disconnected
- Progress updates are only sent to clients in the specific session
- All WebSocket events are logged for debugging purposes