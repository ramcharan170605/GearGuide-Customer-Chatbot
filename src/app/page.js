"use client"

import React, { useState, useRef, useEffect } from "react"
import { Send, Sparkles, Loader2, MessageSquare, Plus, Settings, Trash2, Moon, Sun, Menu, ChevronLeft, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useUser, useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function Home() {
  const { user, isLoaded } = useUser()
  const clerk = useClerk()
  const router = useRouter()
  
  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState("")
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleSettingsClick = () => {
    if (!user) {
      router.push("/sign-in")
    } else {
      setSettingsOpen(true)
    }
  }
  
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const activeConversation = conversations.find((c) => c.id === activeConversationId)

  // Handle client-side mount to load theme and conversation history
  useEffect(() => {
    setMounted(true)
    
    // Load Dark Mode
    const savedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const isDark = savedTheme ? savedTheme === "dark" : prefersDark
    setDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  // Load Conversations once user info is loaded
  useEffect(() => {
    if (!mounted || !isLoaded || !user) return

    const storageKey = `conversations_${user.id}`
    const savedConvs = localStorage.getItem(storageKey)
    if (savedConvs) {
      try {
        const parsed = JSON.parse(savedConvs)
        if (parsed.length > 0) {
          setConversations(parsed)
          setActiveConversationId(parsed[0].id)
          return
        }
      } catch (e) {
        console.error("Failed to load conversations:", e)
      }
    }
    
    // Fallback: Create initial conversation
    const initialId = Date.now().toString()
    const initialConv = {
      id: initialId,
      title: "New Chat",
      messages: [],
      lastMessage: new Date().toISOString(),
    }
    setConversations([initialConv])
    setActiveConversationId(initialId)
  }, [mounted, isLoaded, user])

  // Persist Conversations when they change
  useEffect(() => {
    if (!mounted || !user) return
    const storageKey = `conversations_${user.id}`
    localStorage.setItem(storageKey, JSON.stringify(conversations))
  }, [conversations, mounted, user])

  // Scroll to bottom when messages or typing state changes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [activeConversation?.messages, isTyping])

  // Auto-grow input textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const toggleTheme = () => {
    const nextTheme = !darkMode
    setDarkMode(nextTheme)
    if (nextTheme) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }

  const createNewConversation = () => {
    const newId = Date.now().toString()
    const newConv = {
      id: newId,
      title: "New Chat",
      messages: [],
      lastMessage: new Date().toISOString(),
    }
    setConversations((prev) => [newConv, ...prev])
    setActiveConversationId(newId)
    setInput("")
    // Focus textarea
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  const deleteConversation = (id, e) => {
    e.stopPropagation()
    const updated = conversations.filter((c) => c.id !== id)
    setConversations(updated)
    
    if (activeConversationId === id) {
      if (updated.length > 0) {
        setActiveConversationId(updated[0].id)
      } else {
        const fallbackId = Date.now().toString()
        const fallbackConv = {
          id: fallbackId,
          title: "New Chat",
          messages: [],
          lastMessage: new Date().toISOString(),
        }
        setConversations([fallbackConv])
        setActiveConversationId(fallbackId)
      }
    }
  }

  const clearChatHistory = () => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversationId
          ? {
              ...conv,
              messages: [],
              title: "New Chat",
              lastMessage: new Date().toISOString(),
            }
          : conv
      )
    )
  }

  const handleSendMessage = async (e) => {
    e?.preventDefault()
    if (input.trim() === "" || isTyping || !user) return

    const userMessageText = input
    setInput("")
    
    // Add user message to state
    const userMessage = {
      id: Date.now().toString(),
      text: userMessageText,
      isUser: true,
      timestamp: new Date().toISOString(),
    }

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversationId
          ? {
              ...conv,
              messages: [...conv.messages, userMessage],
              title: conv.messages.length === 0 ? userMessageText.slice(0, 30) : conv.title,
              lastMessage: new Date().toISOString(),
            }
          : conv
      )
    )

    setIsTyping(true)

    try {
      // Associate sessionId with the authenticated Clerk user ID
      const n8nSessionId = `${user.id}_${activeConversationId}`

      // Send message to our Next.js API route proxying n8n
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessageText,
          sessionId: n8nSessionId,
        }),
      })

      const data = await response.json()
      
      let replyText = ""
      if (response.ok) {
        if (typeof data === "string") {
          replyText = data
        } else if (data.output) {
          replyText = data.output
        } else if (data.response) {
          replyText = data.response
        } else if (data.text) {
          replyText = data.text
        } else {
          replyText = JSON.stringify(data)
        }
      } else {
        replyText = `⚠️ Failed to get response from agent. Error: ${data.error || "Unknown error"}`
      }

      // Add assistant response to state
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        text: replyText,
        isUser: false,
        timestamp: new Date().toISOString(),
      }

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? {
                ...conv,
                messages: [...conv.messages, assistantMessage],
                lastMessage: new Date().toISOString(),
              }
            : conv
        )
      )
    } catch (err) {
      console.error("Fetch error:", err)
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: `⚠️ Network error. Please check your internet connection or n8n server status.`,
        isUser: false,
        timestamp: new Date().toISOString(),
      }
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? {
                ...conv,
                messages: [...conv.messages, errorMessage],
                lastMessage: new Date().toISOString(),
              }
            : conv
        )
      )
    } finally {
      setIsTyping(false)
    }
  }

  // Prevent hydration mismatches and wait for auth info
  if (!mounted || !isLoaded) {
    return null
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground font-sans">
      {/* Sidebar (Desktop Slide-in / Mobile Drawer) */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex-shrink-0 h-full border-r border-border bg-card/60 backdrop-blur-md flex flex-col z-20 overflow-hidden"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <Button
                onClick={createNewConversation}
                variant="outline"
                className="flex-1 mr-2 text-sm justify-start font-medium"
              >
                <Plus className="mr-2 h-4 w-4" />
                New chat
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="h-9 w-9"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={cn(
                    "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 border",
                    activeConversationId === conv.id
                      ? "bg-secondary text-secondary-foreground border-border/80 shadow-xs"
                      : "hover:bg-secondary/40 border-transparent"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm font-medium truncate">{conv.title}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive h-7 w-7 rounded-lg transition-opacity duration-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-border space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-sm hover:bg-secondary/50 font-medium"
                onClick={toggleTheme}
              >
                {darkMode ? <Sun className="mr-2.5 h-4 w-4 text-amber-500" /> : <Moon className="mr-2.5 h-4 w-4 text-indigo-500" />}
                {darkMode ? "Light mode" : "Dark mode"}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-sm hover:bg-secondary/50 font-medium"
                onClick={handleSettingsClick}
              >
                <Settings className="mr-2.5 h-4 w-4 text-muted-foreground" />
                Settings
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Chat Window */}
      <main className="flex-1 flex flex-col h-full relative min-w-0 bg-background/50">
        {/* Chat Header */}
        <header className="h-14 border-b border-border bg-card/40 backdrop-blur-md flex items-center justify-between px-4 z-10">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="h-9 w-9"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Sparkles className="h-4.5 w-4.5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-sm font-semibold leading-none">GearGuide AI</h1>
                <p className="text-xxs text-muted-foreground mt-0.5">Powered by Supabase Vector Knowledge</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeConversation?.messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChatHistory}
                className="text-xs text-muted-foreground hover:text-foreground hover:bg-secondary h-8 px-2.5"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Clear Chat
              </Button>
            )}
            
            {/* User Profile Avatar click opens the settings menu */}
            <div 
              onClick={handleSettingsClick}
              className="cursor-pointer hover:opacity-85 transition-opacity"
            >
              <Avatar className="h-8 w-8 border bg-card">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {user?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {activeConversation?.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
                className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/80 border shadow-xs"
              >
                <MessageSquare className="h-8 w-8 text-primary" />
              </motion.div>
              <motion.h2
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold tracking-tight mb-2 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/75 bg-clip-text text-transparent"
              >
                Welcome, {user?.firstName || 'User'}
              </motion.h2>
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-muted-foreground leading-relaxed"
              >
                Ask me questions about gear, specifications, customer recommendations, and let me retrieve information from Supabase vector storage.
              </motion.p>
            </div>
          ) : (
            <div className="space-y-6 max-w-3xl mx-auto pb-10">
              <AnimatePresence initial={false}>
                {activeConversation?.messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "flex gap-4",
                      msg.isUser ? "justify-end" : "justify-start"
                    )}
                  >
                    {!msg.isUser && (
                      <Avatar className="h-8 w-8 border bg-card shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <Sparkles className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 text-sm shadow-xs transition-all leading-relaxed",
                        msg.isUser
                          ? "bg-primary text-primary-foreground selection:bg-background selection:text-foreground"
                          : "bg-card/75 border border-border/80 text-foreground selection:bg-primary selection:text-primary-foreground"
                      )}
                    >
                      {msg.isUser ? (
                        <p className="white-space-pre-wrap">{msg.text}</p>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {msg.isUser && (
                      <Avatar className="h-8 w-8 border bg-card shrink-0">
                        <AvatarImage src={user?.imageUrl} />
                        <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
                          {user?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4 justify-start"
                >
                  <Avatar className="h-8 w-8 border bg-card shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Sparkles className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-2xl px-5 py-3.5 bg-card/75 border border-border/80 flex items-center justify-center">
                    <div className="flex items-center space-x-1.5">
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-primary/80"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-primary/80"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-primary/80"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Form Footer */}
        <footer className="border-t border-border bg-card/30 backdrop-blur-md p-4">
          <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto relative">
            <div
              className={cn(
                "relative flex items-end rounded-2xl border bg-background/90 shadow-sm transition-all duration-200",
                isFocused ? "border-primary ring-[3px] ring-primary/10" : "border-border/80"
              )}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                rows={1}
                placeholder="Message GearGuide AI..."
                className="flex-grow bg-transparent border-0 resize-none px-4 py-3.5 max-h-48 outline-none text-sm placeholder:text-muted-foreground/75 leading-relaxed overflow-y-auto"
              />
              <div className="p-2 shrink-0">
                <Button
                  type="submit"
                  disabled={input.trim() === "" || isTyping}
                  size="icon"
                  className="rounded-xl h-8.5 w-8.5"
                >
                  {isTyping ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <Send className="h-4.5 w-4.5" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xxs text-center text-muted-foreground/75 mt-2.5">
              GearGuide chatbot retrieves context from Supabase Vector Storage. Responses may take a few seconds to query.
            </p>
          </form>
        </footer>
      </main>

      {/* Account Settings Modal */}
      <AnimatePresence>
        {settingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-card border border-border/80 rounded-2xl shadow-lg p-6 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Account & Settings</h3>
                <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {/* User profile card */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-secondary/40 border border-border/40 mb-6">
                <Avatar className="h-12 w-12 border bg-card">
                  <AvatarImage src={user?.imageUrl} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                    {user?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{user?.fullName || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                {/* Profile Detail */}
                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/40 transition-colors">
                  <span className="text-sm font-medium">Profile</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">{user?.fullName}</span>
                </div>

                {/* Manage Account */}
                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/40 transition-colors">
                  <span className="text-sm font-medium">Manage Account</span>
                  <Button variant="outline" size="sm" onClick={() => { setSettingsOpen(false); clerk.openUserProfile(); }}>
                    Open Profile
                  </Button>
                </div>
                
                {/* Appearance Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/40 transition-colors">
                  <span className="text-sm font-medium">Appearance</span>
                  <Button variant="outline" size="sm" onClick={toggleTheme}>
                    {darkMode ? <Sun className="mr-1.5 h-4 w-4 text-amber-500" /> : <Moon className="mr-1.5 h-4 w-4 text-indigo-500" />}
                    {darkMode ? "Light" : "Dark"}
                  </Button>
                </div>
                
                {/* Sign Out */}
                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/40 transition-colors mt-2">
                  <span className="text-sm font-medium text-destructive">Sign Out</span>
                  <Button variant="destructive" size="sm" onClick={() => clerk.signOut()}>
                    Logout
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
