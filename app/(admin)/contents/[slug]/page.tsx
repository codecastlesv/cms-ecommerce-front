import InformativePageEditor from '@/components/admin/contents/InformativePageEditor';
import PermissionGate from '@/components/auth/PermissionGate';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { slug } = await params;
    return {
        title: `Editar ${decodeURIComponent(slug)} | Castella Admin`,
    };
}

export default async function EditContentsPage({ params }: Props) {
    const { slug } = await params;
    return (
        <PermissionGate permission="view_contents">
            <InformativePageEditor slug={decodeURIComponent(slug)} />
        </PermissionGate>
    );
}
