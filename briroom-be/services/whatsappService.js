export const sendWhatsAppMessage = async (number, message) => {
  // Dummy send, di log saja
  console.log(`[📲 WA] Sending message to ${number}: ${message}`);

  // Kalau pakai real API seperti Twilio/WA Gateway, panggil di sini
  // await axios.post('https://api.whatsapp-gateway.com/send', { number, message });
};
