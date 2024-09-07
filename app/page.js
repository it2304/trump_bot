import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Box, Typography, Paper, Avatar, IconButton, TextField, Button, Switch, CssBaseline, ThemeProvider } from "@mui/material";

export default function Home() {
    const [messages, setMessages] = useState([
      {
        role: 'assistant',
        content: `Hello. I am a AI chat bot impersonating Donald Trump. Let's talk!`
      }
    ])
    const [message, setMessage ] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const sendMessage = async (e) => {
      if (!message.trim()) return; 

      setMessage('')
      setMessages((messages)=>[
        ...messages,
        { role: 'user', content: message },
        { role: 'assistant', content: '' },
      ])

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([...messages, { role: 'user', content: message }]),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          setMessages((messages)=>{
            let lastMessage = messages[messages.length - 1]
            let otherMessages = messages.slice(0, messages.length - 1)
            return [
              ...otherMessages,
              {
                ...lastMessage,
                content: lastMessage.content + chunk,
              },
            ]
          })           
        }
      } catch (error) {
        console.error('Error:', error)
        setMessages((messages) => [
          ...messages,
          { 
            role: 'assistant', 
            content: "I'm sorry, but I encountered an error. Please try again later." 
          },
        ])
      } finally {
        setIsLoading(false)
      }

      const handleKeyPress = (e) => {
        if (e.key === 'Enter' && e.shiftKey) {
          e.preventDefault()
          sendMessage()
        }
      }

      const messagesEndRef = useRef(null)

      const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }
    
      useEffect(() => {
        scrollToBottom()
      }, [messages])
    }

    const renderMessage = (message) => (
      <Box>
        <ReactMarkdown
          components={{
            code({node, inline, className, children, ...props}) {
              const match = /language-(\w+)/.exec(className || '')
              return !inline && match ? (
                <SyntaxHighlighter
                  style={tomorrow}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            }
          }}
        >
          {message.content}
        </ReactMarkdown>
      </Box>
    );
  
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box 
          sx={{
            width: "100vw",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            bgcolor: "background.default"
          }}
        >
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">Donald Trump Emulator</Typography>
            <Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
          </Box>
          <Paper 
            elevation={3}
            sx={{
              flexGrow: 1,
              width: isMobile ? "100%" : "90%",
              maxWidth: "600px",
              m: 'auto',
              display: "flex",
              flexDirection: "column",
              p: 2,
              overflow: "hidden",
              bgcolor: "background.paper"
            }}
          >
            <Box sx={{ flexGrow: 1, overflow: "auto", mb: 2 }}>
              {messages.map((message, index) => (
                <Box 
                  key={index} 
                  sx={{
                    display: "flex",
                    justifyContent: message.role === "assistant" ? "flex-start" : "flex-end",
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: "flex", flexDirection: "row", alignItems: "flex-start", maxWidth: "80%" }}>
                    {message.role === "assistant" && (
                      <Avatar sx={{ bgcolor: "primary.main", mr: 1, mt: 1 }}>
                        <SmartToyIcon />
                      </Avatar>
                    )}
                    <Paper 
                      elevation={1}
                      sx={{
                        p: 2,
                        bgcolor: message.role === "assistant" ? "primary.light" : "secondary.light",
                        color: theme.palette.getContrastText(message.role === "assistant" ? theme.palette.primary.light : theme.palette.secondary.light),
                      }}
                    >
                      {renderMessage(message)}
                      <IconButton size="small" onClick={() => copyToClipboard(message.content)}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Paper>
                    {message.role === "user" && (
                      <Avatar sx={{ bgcolor: "secondary.main", ml: 1, mt: 1 }}>
                        <PersonIcon />
                      </Avatar>
                    )}
                  </Box>
                </Box>
              ))}
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress />
                </Box>
              )}
            </Box>
            <Box component="form" onSubmit={(e) => { e.preventDefault(); sendMessage(); }} sx={{ display: "flex" }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                sx={{ mr: 1 }}
              />
              <Button 
                variant="contained" 
                endIcon={<SendIcon />}
                type="submit"
                disabled={loading}
              >
                Send
              </Button>
            </Box>
          </Paper>
        </Box>
      </ThemeProvider>
    );
}
