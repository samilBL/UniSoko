export const UNISOKO_CONTACT = {
  developerName: 'Rheis Ifan Misalek',
  phoneE164: '+255616961511',
  phoneDisplay: '+255 616 961 511',
  phoneDigits: '255616961511',
  whatsappUrl: 'https://wa.me/255616961511',
  email: 'qwazerty01012001@gmail.com',
  emailUrl: 'mailto:qwazerty01012001@gmail.com',
} as const;

export const DEVELOPER_PROFILE_DEFAULTS = {
  name: UNISOKO_CONTACT.developerName,
  phone: UNISOKO_CONTACT.phoneE164,
  whatsapp: UNISOKO_CONTACT.phoneE164,
  email: UNISOKO_CONTACT.email,
  story: '',
  link: '',
  imageUrl: '',
  imagePath: '',
} as const;
