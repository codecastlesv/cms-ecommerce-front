import NewsletterList from "@/components/admin/newsletter/NewsletterList";

export const metadata = {
    title: 'Newsletter | Galaxia Admin',
    description: 'Lista de suscriptores al boletín de noticias.',
};

export default function NewsletterPage() {
    return <NewsletterList />;
}