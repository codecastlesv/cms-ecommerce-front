import NewsletterList from "@/components/admin/newsletter/NewsletterList";

export const metadata = {
    title: 'Newsletter | Castella Admin',
    description: 'Lista de suscriptores al boletín de noticias.',
};

export default function NewsletterPage() {
    return <NewsletterList />;
}