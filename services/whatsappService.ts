import { WhatsAppConfig } from '../types';

/**
 * Mocks sending a message via the WhatsApp Business API.
 * In a real application, this would make an HTTP request to Meta's Graph API.
 * @param customerPhoneNumber The recipient's phone number.
 * @param message The text message to send.
 * @param config The vendor's WhatsApp API configuration.
 */
export const sendWhatsAppMessage = async (
  customerPhoneNumber: string,
  message: string,
  config: WhatsAppConfig
): Promise<{ success: boolean; messageId?: string }> => {
  console.log('--- Mock WhatsApp Service ---');
  console.log(`Attempting to send message to: ${customerPhoneNumber}`);
  console.log(`Message: "${message}"`);
  console.log(`Using Vendor Config (Account ID): ${config.accountId}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Simulate a successful API call
  if (customerPhoneNumber && message && config.enabled) {
    const mockMessageId = `wamid.mock.${Date.now()}`;
    console.log(`✅ Message sent successfully. Message ID: ${mockMessageId}`);
    return { success: true, messageId: mockMessageId };
  } else {
    console.error('❌ Failed to send message. Invalid parameters or WhatsApp is disabled for this vendor.');
    return { success: false };
  }
};
