import { useState, useMemo } from 'react';
import {
  Dialog,
  Slide,
  Grow,
  Fade
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Business,
  Person,
  ArrowForward,
  People,
  Phone,
  Close,
  EmailOutlined,
  LocationOnOutlined
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/useDataStore';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Client } from '../../types';
import { PageHero, Button as PrimButton } from '../../design-system/primitives';
import { cn } from '../../design-system/primitives/cn';
import { useBrand } from '../../config/BrandProvider';

const clientSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صحيح').or(z.literal('')).optional(),
  phone: z.string().min(8, 'رقم الهاتف غير صحيح'),
  address: z.string().min(3, 'العنوان يجب أن يكون 3 أحرف على الأقل'),
  type: z.enum(['company', 'individual']),
});

type ClientFormData = z.infer<typeof clientSchema>;

export const ClientsPage = () => {
  const navigate = useNavigate();
  const brand = useBrand();
  const rtl = brand.direction === 'rtl';
  const { clients, expenses, payments, addClient, updateClient, deleteClient } = useDataStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: '', email: '', phone: '', address: '', type: 'individual' },
  });

  const filteredClients = useMemo(() => {
    return clients.filter((client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.includes(searchQuery)
    );
  }, [clients, searchQuery]);

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      reset({
        name: client.name,
        email: client.email || '',
        phone: client.phone,
        address: client.address,
        type: client.type,
      });
    } else {
      setEditingClient(null);
      reset({ name: '', email: '', phone: '', address: '', type: 'individual' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingClient(null);
    reset();
  };

  const onSubmit = (data: ClientFormData) => {
    if (editingClient) {
      updateClient(editingClient.id, data);
    } else {
      const newClient: Client = {
        ...data,
        name: data.name!,
        email: data.email || '',
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Client;
      addClient(newClient);
    }
    handleCloseDialog();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-4 pb-14 space-y-6">
      
      {/* Super Hero Section */}
      <PageHero
        reveal
        accent="brand"
        eyebrow={
          <span className="flex items-center gap-1.5 text-inherit">
            <People sx={{ fontSize: 16 }} />
            {rtl ? 'إدارة العملاء' : 'Client Management'}
          </span>
        }
        title={rtl ? 'دليل العملاء والشركات' : 'Clients & Companies Directory'}
        subtitle={rtl ? 'أضف العملاء الجدد وتتبع تفاصيلهم المالية واللوجستية.' : 'Add new clients and track their financial details.'}
        headline={filteredClients.length.toString()}
        headlineLabel={rtl ? 'إجمالي العملاء' : 'Total Clients'}
        trailing={
          <button
            onClick={() => handleOpenDialog()}
            className="flex items-center gap-2 bg-white text-[var(--brand-primary)] hover:bg-white/90 px-5 py-3 rounded-2xl font-black font-arabic text-sm shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 pointer-events-auto cursor-pointer"
          >
            <Add sx={{ fontSize: 20 }} />
            {rtl ? 'عميل جديد' : 'New Client'}
          </button>
        }
      />

      {/* Search & Actions */}
      <div className="relative z-10 -mt-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="bg-surface-panel backdrop-blur-2xl border border-[var(--surface-border-strong)] rounded-[24px] p-2 shadow-lg flex items-center">
          <div className="pl-4 pr-3 text-fg-muted">
            <Search />
          </div>
          <input 
            className="flex-1 bg-transparent border-none outline-none text-fg font-arabic font-bold text-base placeholder:text-fg-subtle placeholder:font-medium h-12"
            placeholder={rtl ? "ابحث بالاسم أو رقم الهاتف..." : "Search by name or phone..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        {filteredClients.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center bg-surface-panel border border-dashed border-[var(--surface-border-strong)] rounded-3xl animate-fade-in">
            <People sx={{ fontSize: 80 }} className="text-fg-subtle mb-4" />
            <h3 className="text-xl font-extrabold text-fg font-arabic mb-2">لا يوجد عملاء</h3>
            <p className="text-fg-muted font-default mb-6 text-sm">أضف أول عميل وابدأ بإدارة حساباته الان</p>
            <PrimButton onClick={() => handleOpenDialog()} leftIcon={<Add />} className="btn-primary flex">
              إضافة عميل
            </PrimButton>
          </div>
        ) : (
          filteredClients.map((client, idx) => (
            <div 
              key={client.id}
              onClick={() => navigate(`/clients/${client.id}`)}
              className="group cursor-pointer bg-surface-panel border border-[var(--surface-border)] rounded-[24px] p-5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-[var(--brand-primary)]/40 relative overflow-hidden flex flex-col animate-fade-in-up"
              style={{ animationDelay: `${(idx % 10) * 0.05}s` }}
            >
              {/* Internal abstract glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-[var(--brand-primary)]/10 to-transparent rounded-full blur-2xl group-hover:bg-[var(--brand-primary)]/20 transition-colors pointer-events-none"></div>

              <div className="flex items-start justify-between gap-3 mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex shrink-0 items-center justify-center w-[54px] h-[54px] rounded-[18px] text-white shadow-md ring-2 ring-white/10 relative overflow-hidden group-hover:scale-105 transition-transform",
                    client.type === 'company' ? "bg-gradient-to-tr from-[#1d4ed8] to-[#3b82f6]" : "bg-gradient-to-tr from-[#64748b] to-[#94a3b8]"
                  )}>
                    {/* Glossy overlay layer */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
                    {client.type === 'company' ? <Business fontSize="medium" /> : <Person fontSize="medium" />}
                  </div>
                  <div>
                    <h3 className="text-[1.1rem] font-extrabold text-fg font-arabic tracking-tight line-clamp-1">{client.name}</h3>
                    <span className={cn(
                      "inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black font-arabic tracking-wider",
                      client.type === 'company' 
                        ? "bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]"
                        : "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                    )}>
                      {client.type === 'company' ? 'شركة / مؤسسة' : 'فرد / شخصي'}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); handleOpenDialog(client); }}
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-sunken hover:bg-[var(--brand-primary)] text-fg-subtle hover:text-white transition-all shadow-sm border border-[var(--surface-border)]"
                >
                  <Edit sx={{ fontSize: 16 }} />
                </button>
              </div>

              <div className="space-y-2 mt-auto relative z-10 pt-2 border-t border-[var(--surface-border)]">
                <div className="flex items-center gap-2 text-fg-muted">
                  <Phone sx={{ fontSize: 16 }} className="opacity-70" />
                  <span className="text-sm font-semibold font-num tabular">{client.phone}</span>
                </div>
                {client.email && (
                  <div className="flex items-center gap-2 text-fg-muted">
                    <EmailOutlined sx={{ fontSize: 16 }} className="opacity-70" />
                    <span className="text-sm font-medium truncate">{client.email}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pro Max Responsive Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
        TransitionComponent={Fade}
        transitionDuration={350}
        PaperProps={{
          className: "bg-surface-panel/95 backdrop-blur-[40px] border border-[var(--surface-border-strong)] rounded-[32px] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] m-4"
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-32 bg-[var(--brand-primary)]/10 blur-[50px] -z-10 pointer-events-none"></div>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex items-center justify-between p-6 border-b border-[var(--surface-border)]">
            <div>
              <h2 className="text-xl font-extrabold text-fg font-arabic">{editingClient ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</h2>
              <p className="text-xs text-fg-muted font-medium mt-1 font-arabic">أدخل التفاصيل المطلوبة لإدراج العميل في النظام</p>
            </div>
            <button
              type="button"
              onClick={handleCloseDialog}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-sunken text-fg hover:bg-red-500 hover:text-white transition-colors"
            >
              <Close sx={{ fontSize: 20 }} />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-bold text-fg mb-1.5 font-arabic">اسم العميل / الشركة <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-fg-muted group-focus-within:text-[var(--brand-primary)] transition-colors">
                      <Person sx={{ fontSize: 20 }} />
                    </div>
                    <input 
                      {...field}
                      className={cn(
                        "w-full bg-surface-raised border rounded-xl py-3 pl-4 pr-10 text-fg font-bold font-arabic focus:outline-none transition-all",
                        errors.name ? "border-red-500 focus:ring-2 focus:ring-red-500/20" : "border-[var(--surface-border-strong)] focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--brand-primary)]/10 hover:border-fg-subtle"
                      )}
                      placeholder="محمد أحمد أو شركة التقنية"
                    />
                  </div>
                  {errors.name && <p className="mt-1 text-xs text-red-500 font-bold font-arabic">{errors.name.message}</p>}
                </div>
              )}
            />

            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-bold text-fg mb-1.5 font-arabic">نوع الحساب</label>
                  <div className="grid grid-cols-2 gap-3 bg-surface-raised p-1.5 rounded-[16px] border border-[var(--surface-border)]">
                    <button
                      type="button"
                      onClick={() => field.onChange('individual')}
                      className={cn(
                        "flex items-center justify-center gap-2 py-2.5 rounded-[12px] font-bold text-sm transition-all duration-300 font-arabic",
                        field.value === 'individual' ? "bg-surface-panel shadow-sm text-[var(--brand-primary)] border border-transparent" : "text-fg-muted hover:text-fg hover:bg-surface-sunken"
                      )}
                    >
                      <Person sx={{ fontSize: 18 }} /> حساب فرد
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange('company')}
                      className={cn(
                        "flex items-center justify-center gap-2 py-2.5 rounded-[12px] font-bold text-sm transition-all duration-300 font-arabic",
                        field.value === 'company' ? "bg-surface-panel shadow-sm text-[var(--brand-primary)] border border-transparent" : "text-fg-muted hover:text-fg hover:bg-surface-sunken"
                      )}
                    >
                      <Business sx={{ fontSize: 18 }} /> حساب شركة
                    </button>
                  </div>
                </div>
              )}
            />

            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-bold text-fg mb-1.5 font-arabic">رقم الهاتف <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-fg-muted group-focus-within:text-[var(--brand-primary)] transition-colors">
                      <Phone sx={{ fontSize: 20 }} />
                    </div>
                    <input 
                      {...field}
                      dir="ltr"
                      className={cn(
                        "w-full bg-surface-raised border rounded-xl py-3 pl-4 pr-10 text-right text-fg font-bold font-num tabular focus:outline-none transition-all",
                        errors.phone ? "border-red-500 focus:ring-2 focus:ring-red-500/20" : "border-[var(--surface-border-strong)] focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--brand-primary)]/10 hover:border-fg-subtle"
                      )}
                      placeholder="0912345678"
                    />
                  </div>
                  {errors.phone && <p className="mt-1 text-xs text-red-500 font-bold font-arabic">{errors.phone.message}</p>}
                </div>
              )}
            />

            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-bold text-fg mb-1.5 font-arabic">البريد الإلكتروني <span className="text-fg-muted font-normal text-xs">(اختياري)</span></label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-fg-muted group-focus-within:text-[var(--brand-primary)] transition-colors">
                      <EmailOutlined sx={{ fontSize: 20 }} />
                    </div>
                    <input 
                      {...field}
                      dir="ltr"
                      className={cn(
                        "w-full bg-surface-raised border rounded-xl py-3 pl-4 pr-10 text-right text-fg font-medium font-sans focus:outline-none transition-all",
                        errors.email ? "border-red-500 focus:ring-2 focus:ring-red-500/20" : "border-[var(--surface-border-strong)] focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--brand-primary)]/10 hover:border-fg-subtle"
                      )}
                      placeholder="client@mail.com"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-red-500 font-bold font-arabic">{errors.email.message}</p>}
                </div>
              )}
            />

            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-bold text-fg mb-1.5 font-arabic">العنوان الإقليمي المعتمد <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <div className="absolute top-3 right-0 flex items-center pr-3 pointer-events-none text-fg-muted group-focus-within:text-[var(--brand-primary)] transition-colors">
                      <LocationOnOutlined sx={{ fontSize: 20 }} />
                    </div>
                    <textarea 
                      {...field}
                      rows={2}
                      className={cn(
                        "w-full bg-surface-raised border rounded-xl py-3 pl-4 pr-10 text-fg font-bold font-arabic focus:outline-none transition-all resize-none",
                        errors.address ? "border-red-500 focus:ring-2 focus:ring-red-500/20" : "border-[var(--surface-border-strong)] focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--brand-primary)]/10 hover:border-fg-subtle"
                      )}
                      placeholder="المدينة، الشارع، المعالم البارزة"
                    />
                  </div>
                  {errors.address && <p className="mt-1 text-xs text-red-500 font-bold font-arabic">{errors.address.message}</p>}
                </div>
              )}
            />
          </div>

          <div className="p-6 border-t border-[var(--surface-border)] bg-surface-sunken/30 rounded-b-[32px] flex flex-col gap-3">
            <button
              type="submit"
              className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white py-4 rounded-xl font-extrabold font-arabic text-base shadow-brand transition-all hover:scale-[1.01] active:scale-95"
            >
              {editingClient ? 'اعتماد التعديلات' : 'إضافة العميل وتوثيقه'}
            </button>
            
            {editingClient && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`هل أنت متأكد من حذف العميل "${editingClient.name}" نهائياً من النظام؟`)) {
                    deleteClient(editingClient.id);
                    handleCloseDialog();
                  }
                }}
                className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white py-3 rounded-xl font-bold font-arabic text-sm transition-all"
              >
                <Delete sx={{ fontSize: 18 }} />
                حذف العميل نهائياً
              </button>
            )}
            {!editingClient && (
              <button
                type="button"
                onClick={handleCloseDialog}
                className="w-full bg-transparent hover:bg-surface-hover text-fg-subtle py-3 rounded-xl font-bold font-arabic text-sm transition-colors"
              >
                تراجع وإلغاء
              </button>
            )}
          </div>
        </form>
      </Dialog>
    </div>
  );
};
