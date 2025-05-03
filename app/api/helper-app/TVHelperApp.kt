package com.mediaplayer.tvhelper

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.ServerSocket
import java.util.concurrent.Executors

class MainActivity : Activity() {
    private val TAG = "TVHelperApp"
    private val PORT = 8765
    private var serverRunning = false
    private val executor = Executors.newSingleThreadExecutor()
    private val handler = Handler(Looper.getMainLooper())
    private var serverSocket: ServerSocket? = null
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        val statusText = findViewById<TextView>(R.id.statusText)
        val serverUrlInput = findViewById<EditText>(R.id.serverUrlInput)
        val startButton = findViewById<Button>(R.id.startButton)
        val testButton = findViewById<Button>(R.id.testButton)
        
        startButton.setOnClickListener {
            if (!serverRunning) {
                startServer()
                startButton.text = "Stop Server"
                statusText.text = "Server running on port $PORT"
                serverRunning = true
            } else {
                stopServer()
                startButton.text = "Start Server"
                statusText.text = "Server stopped"
                serverRunning = false
            }
        }
        
        testButton.setOnClickListener {
            val url = serverUrlInput.text.toString()
            if (url.isNotEmpty()) {
                openBrowser(url)
            } else {
                Toast.makeText(this, "Please enter a URL", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun startServer() {
        executor.execute {
            try {
                serverSocket = ServerSocket(PORT)
                Log.d(TAG, "Server started on port $PORT")
                
                while (serverRunning) {
                    try {
                        val socket = serverSocket?.accept()
                        val input = BufferedReader(InputStreamReader(socket?.getInputStream()))
                        val command = input.readLine()
                        
                        Log.d(TAG, "Received command: $command")
                        
                        handler.post {
                            when {
                                command.startsWith("OPEN_URL:") -> {
                                    val url = command.substring(9)
                                    openBrowser(url)
                                }
                                command == "REFRESH" -> {
                                    // Send keycode for refresh
                                    try {
                                        Runtime.getRuntime().exec("input keyevent 82")
                                    } catch (e: Exception) {
                                        Log.e(TAG, "Error sending refresh keycode", e)
                                    }
                                }
                            }
                        }
                        
                        socket?.close()
                    } catch (e: Exception) {
                        if (serverRunning) {
                            Log.e(TAG, "Error accepting connection", e)
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error starting server", e)
                handler.post {
                    Toast.makeText(this, "Failed to start server: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }
    
    private fun stopServer() {
        serverRunning = false
        try {
            serverSocket?.close()
        } catch (e: Exception) {
            Log.e(TAG, "Error closing server socket", e)
        }
    }
    
    private fun openBrowser(url: String) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            startActivity(intent)
            Toast.makeText(this, "Opening browser with URL: $url", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            Log.e(TAG, "Error opening browser", e)
            Toast.makeText(this, "Failed to open browser: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        stopServer()
        executor.shutdown()
    }
}
