export function createWhatsAppLink(contact: string, message: string) {
  const digits = contact.replace(/\D/g, '');
  const internationalNumber = digits.startsWith('0') ? `255${digits.slice(1)}` : digits;
  return `https://wa.me/${internationalNumber}?text=${encodeURIComponent(message)}`;
}
