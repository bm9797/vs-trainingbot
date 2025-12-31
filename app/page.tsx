"use client";

import { useState, useCallback } from "react";
import { MessageList, ChatInput, EmptyState } from "@/components/chat";
import { Message, createUserMessage, createAssistantMessage } from "@/lib/types";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = useCallback((content: string) => {
    // Create and add user message
    const userMessage = createUserMessage(content);
    setMessages((prev) => [...prev, userMessage]);

    // For now, simulate an assistant response (API integration comes in Sprint 4)
    setIsLoading(true);

    // Create a loading placeholder message
    const loadingMessage = createAssistantMessage("", true);
    setMessages((prev) => [...prev, loadingMessage]);

    // Simulate API delay and response
    setTimeout(() => {
      setMessages((prev) => {
        // Remove the loading message and add the actual response
        const withoutLoading = prev.filter((msg) => msg.id !== loadingMessage.id);
        const assistantMessage = createAssistantMessage(
          getPlaceholderResponse(content)
        );
        return [...withoutLoading, assistantMessage];
      });
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleSelectQuestion = useCallback(
    (question: string) => {
      handleSendMessage(question);
    },
    [handleSendMessage]
  );

  const hasMessages = messages.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
          <h1 className="text-lg font-semibold">Vitasigns Training Bot</h1>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
        {hasMessages ? (
          <MessageList messages={messages} />
        ) : (
          <EmptyState onSelectQuestion={handleSelectQuestion} />
        )}
      </main>

      {/* Chat Input - Fixed at bottom */}
      <div className="sticky bottom-0 mx-auto w-full max-w-3xl">
        <ChatInput onSend={handleSendMessage} isDisabled={isLoading} />
      </div>
    </div>
  );
}

/**
 * Placeholder response generator for Sprint 3 testing
 * This will be replaced with actual API calls in Sprint 4
 */
function getPlaceholderResponse(question: string): string {
  const lowerQuestion = question.toLowerCase();

  if (lowerQuestion.includes("sop") || lowerQuestion.includes("clinical")) {
    return `**Clinical SOPs Overview**

Here are the key clinical SOPs you should be familiar with:

1. **Patient Intake Protocol** - Covers the initial patient registration and data collection process
2. **Documentation Standards** - Guidelines for proper medical documentation
3. **Compliance Requirements** - HIPAA and regulatory compliance procedures
4. **Quality Assurance** - Regular audit and review processes

I can provide more details on any specific SOP. What would you like to know more about?`;
  }

  if (lowerQuestion.includes("hubspot")) {
    return `**HubSpot Navigation Guide**

The HubSpot dashboard is organized into several key areas:

- **Contacts** - Manage all contact records and their properties
- **Companies** - View and edit company information
- **Deals** - Track sales pipeline and deal stages
- **Tasks** - Manage your to-do items and follow-ups

To get started, I recommend exploring the Contacts section first. Would you like a detailed walkthrough of any specific area?`;
  }

  if (lowerQuestion.includes("healtharc") || lowerQuestion.includes("patient intake")) {
    return `**HealthArc Patient Intake Process**

The patient intake process in HealthArc follows these steps:

1. **Create New Patient Record** - Click "Add Patient" from the main dashboard
2. **Enter Demographics** - Fill in patient information including name, DOB, and contact details
3. **Insurance Verification** - Add insurance information and verify eligibility
4. **Schedule Appointment** - Select available time slots and assign to provider
5. **Send Confirmation** - System automatically sends confirmation to patient

Would you like me to explain any of these steps in more detail?`;
  }

  if (lowerQuestion.includes("compliance") || lowerQuestion.includes("documentation")) {
    return `**Documentation Compliance Requirements**

All documentation must adhere to the following requirements:

- **Accuracy** - Information must be factually correct and up-to-date
- **Completeness** - All required fields must be filled out
- **Timeliness** - Documentation should be completed within 24 hours
- **Security** - PHI must be handled according to HIPAA guidelines
- **Retention** - Records must be kept for the required retention period

Do you have specific questions about any compliance requirement?`;
  }

  return `Thank you for your question!

I am currently in demonstration mode (Sprint 3). In the next sprint, I will be connected to the Vitasigns knowledge base and will be able to provide accurate answers about:

- **Clinical SOPs** - Standard operating procedures and protocols
- **HubSpot Workflows** - CRM navigation and best practices
- **HealthArc Navigation** - Platform usage and patient management

For now, try asking about one of these topics and I will show you a sample response.`;
}
