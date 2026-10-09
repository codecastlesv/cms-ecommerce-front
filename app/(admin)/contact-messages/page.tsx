import ContactMessageList from '@/components/admin/contactMessages/ContactMessageList';

export const metadata = {
    title: 'Mensajes de Contacto | Castella Admin',
    description: 'Mensajes recibidos desde el formulario público de Contáctanos.',
};

export default function ContactMessagesPage() {
    return <ContactMessageList />;
}
