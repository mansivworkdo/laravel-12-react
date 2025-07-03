import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DeleteConfirmation from '@/components/blogs/delete-confirmation';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Search, Trash2, Edit, Plus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useState } from 'react';

interface Blog {
    id: number;
    title: string;
    content: string;
    created_at: string;
}

interface BlogForm {
    title: string;
    content: string;
}

interface Props {
    blogs: {
        data: Blog[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    filters: { search?: string; sort?: string; direction?: string; per_page?: number };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Blogs', href: '/blogs' },
];

const Pagination = ({ blogs, filters }: { blogs: Props['blogs'], filters: Props['filters'] }) => {
    const { current_page, last_page } = blogs;
    
    const navigateToPage = (page: number) => {
        router.get(`/blogs`, { ...filters, page }, { preserveState: true });
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        
        if (last_page <= maxVisiblePages) {
            // Show all pages if total pages <= maxVisiblePages
            for (let i = 1; i <= last_page; i++) {
                pages.push(i);
            }
        } else {
            // Complex pagination logic for many pages
            if (current_page <= 3) {
                // Show first 3 pages + ellipsis + last page
                pages.push(1, 2, 3, 4);
                if (last_page > 5) {
                    pages.push('ellipsis');
                }
                pages.push(last_page);
            } else if (current_page >= last_page - 2) {
                // Show first page + ellipsis + last 3 pages
                pages.push(1);
                if (last_page > 5) {
                    pages.push('ellipsis');
                }
                pages.push(last_page - 3, last_page - 2, last_page - 1, last_page);
            } else {
                // Show first page + ellipsis + current-1, current, current+1 + ellipsis + last page
                pages.push(1);
                pages.push('ellipsis');
                pages.push(current_page - 1, current_page, current_page + 1);
                pages.push('ellipsis');
                pages.push(last_page);
            }
        }
        
        return pages;
    };

    if (last_page <= 1) return null;

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
            <div className="text-sm text-muted-foreground">
                Showing {blogs.from} to {blogs.to} of {blogs.total} results
            </div>
            
            <div className="flex items-center gap-2">
                {/* First Page Button */}
                <Button
                    variant="outline"
                    size="sm"
                    disabled={current_page === 1}
                    onClick={() => navigateToPage(1)}
                >
                    First
                </Button>
                
                {/* Previous Page Button */}
                <Button
                    variant="outline"
                    size="sm"
                    disabled={current_page === 1}
                    onClick={() => navigateToPage(current_page - 1)}
                >
                    Previous
                </Button>
                
                {/* Page Numbers */}
                <div className="flex gap-1">
                    {getPageNumbers().map((page, index) => (
                        page === 'ellipsis' ? (
                            <span key={`ellipsis-${index}`} className="px-2 py-1 text-sm text-muted-foreground">
                                ...
                            </span>
                        ) : (
                            <Button
                                key={page}
                                variant={page === current_page ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => navigateToPage(page as number)}
                            >
                                {page}
                            </Button>
                        )
                    ))}
                </div>
                
                {/* Next Page Button */}
                <Button
                    variant="outline"
                    size="sm"
                    disabled={current_page === last_page}
                    onClick={() => navigateToPage(current_page + 1)}
                >
                    Next
                </Button>
                
                {/* Last Page Button */}
                <Button
                    variant="outline"
                    size="sm"
                    disabled={current_page === last_page}
                    onClick={() => navigateToPage(last_page)}
                >
                    Last
                </Button>
            </div>
        </div>
    );
};

export default function Index({ blogs, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [showModal, setShowModal] = useState(false);
    const [editingBlog, setEditingBlog] = useState<Blog | undefined>();
    const [deleteDialog, setDeleteDialog] = useState<{ show: boolean; blog?: Blog }>({ show: false });
    const [isDeleting, setIsDeleting] = useState(false);
    const { flash, errors } = usePage().props as any;

    const { register, handleSubmit, reset, formState: { errors: formErrors, isSubmitting } } = useForm<BlogForm>({
        defaultValues: { title: '', content: '' }
    });

    const onSubmit = async (data: BlogForm) => {
        const url = editingBlog ? `/blogs/${editingBlog.id}` : '/blogs';
        const method = editingBlog ? 'put' : 'post';
        
        return new Promise<void>((resolve) => {
            router[method](url, data, {
                onSuccess: () => {
                    reset();
                    setShowModal(false);
                    setEditingBlog(undefined);
                    resolve();
                },
                onError: () => resolve()
            });
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/blogs', { ...filters, search }, { preserveState: true });
    };

    const handleSort = (field: string) => {
        const direction = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        router.get('/blogs', { ...filters, sort: field, direction }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: string) => {
        router.get('/blogs', { ...filters, per_page: perPage }, { preserveState: true });
    };

    const openModal = (blog?: Blog) => {
        setEditingBlog(blog);
        reset(blog ? { title: blog.title, content: blog.content } : { title: '', content: '' });
        setShowModal(true);
    };

    const confirmDelete = () => {
        if (deleteDialog.blog) {
            setIsDeleting(true);
            router.delete(`/blogs/${deleteDialog.blog.id}`, {
                onFinish: () => {
                    setIsDeleting(false);
                    setDeleteDialog({ show: false });
                }
            });
        }
    };

    const getSortIcon = (field: string) => {
        if (filters.sort !== field) return <ArrowUpDown className="w-4 h-4" />;
        return filters.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Blogs" />
            
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Blogs</h1>
                    <Button onClick={() => openModal()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Blog
                    </Button>
                </div>

                {flash?.success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                        {flash.success}
                    </div>
                )}

                <Card className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                            <Input
                                type="text"
                                placeholder="Search blogs..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1"
                            />
                            <Button type="submit">
                                <Search className="w-4 h-4" />
                            </Button>
                        </form>
                        <Select value={filters.per_page?.toString() || '10'} onValueChange={handlePerPageChange}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5 per page</SelectItem>
                                <SelectItem value="10">10 per page</SelectItem>
                                <SelectItem value="25">25 per page</SelectItem>
                                <SelectItem value="50">50 per page</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-3">
                                        <Button variant="ghost" onClick={() => handleSort('title')} className="h-auto p-0 font-semibold">
                                            Title {getSortIcon('title')}
                                        </Button>
                                    </th>
                                    <th className="text-left p-3">Content</th>
                                    <th className="text-left p-3">
                                        <Button variant="ghost" onClick={() => handleSort('created_at')} className="h-auto p-0 font-semibold">
                                            Created {getSortIcon('created_at')}
                                        </Button>
                                    </th>
                                    <th className="text-left p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {blogs.data.map((blog) => (
                                    <tr key={blog.id} className="border-b">
                                        <td className="p-3 font-medium">{blog.title}</td>
                                        <td className="p-3 text-muted-foreground">
                                            {blog.content.substring(0, 100)}...
                                        </td>
                                        <td className="p-3 text-sm text-muted-foreground">
                                            {new Date(blog.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={() => openModal(blog)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => setDeleteDialog({ show: true, blog })}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {blogs.data.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            No blogs found.
                        </div>
                    )}

                    <Pagination blogs={blogs} filters={filters} />
                </Card>
            </div>
            <Dialog open={showModal} onOpenChange={() => { setShowModal(false); reset(); }}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{editingBlog ? 'Edit Blog' : 'Create Blog'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                {...register('title', { required: 'Title is required', maxLength: { value: 255, message: 'Title must be less than 255 characters' } })}
                                className="mt-1"
                            />
                            {formErrors.title && <InputError message={formErrors.title.message} className="mt-1" />}
                            {errors.title && <InputError message={errors.title} className="mt-1" />}
                        </div>
                        <div>
                            <Label htmlFor="content">Content</Label>
                            <textarea
                                id="content"
                                {...register('content', { required: 'Content is required' })}
                                rows={6}
                                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                            {formErrors.content && <InputError message={formErrors.content.message} className="mt-1" />}
                            {errors.content && <InputError message={errors.content} className="mt-1" />}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => { setShowModal(false); reset(); }}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : editingBlog ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
            
            <DeleteConfirmation
                isOpen={deleteDialog.show}
                onClose={() => setDeleteDialog({ show: false })}
                onConfirm={confirmDelete}
                title={deleteDialog.blog?.title || ''}
                isDeleting={isDeleting}
            />
        </AppLayout>
    );
}