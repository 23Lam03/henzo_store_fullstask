import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../../components/common/Icon';
import { sellerApi } from '../../../services/api/seller';
import { useToast } from '../../../contexts/ToastContext/ToastContext';
import './CreateProductPage.css';

const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const CATEGORIES = ['Điện thoại', 'Laptop', 'PC Gaming', 'Màn hình', 'Chuột', 'Bàn phím', 'Tai nghe', 'Phụ kiện'];
const BRANDS = ['Apple', 'Samsung', 'ASUS', 'Dell', 'Lenovo', 'MSI', 'Razer', 'Logitech', 'Sony', 'Xiaomi'];

interface ProductForm {
  name: string; category: string; brand: string; sku: string;
  shortDesc: string; detailDesc: string;
  price: string; originalPrice: string; stock: string;
  imageUrl: string;
  cpu: string; gpu: string; ram: string; ssd: string; screen: string; pin: string; weight: string;
  isHot: boolean; isNew: boolean; isFeatured: boolean;
}

const EMPTY_FORM: ProductForm = {
  name: '', category: '', brand: '', sku: '',
  shortDesc: '', detailDesc: '',
  price: '', originalPrice: '', stock: '',
  imageUrl: '',
  cpu: '', gpu: '', ram: '', ssd: '', screen: '', pin: '', weight: '',
  isHot: false, isNew: false, isFeatured: false,
};

export const CreateProductPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof ProductForm, val: string | boolean) => {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Tên sản phẩm không được để trống';
    if (!form.category) e.category = 'Vui lòng chọn danh mục';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = 'Giá bán phải lớn hơn 0';
    if (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0) e.stock = 'Số lượng tồn không hợp lệ';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (_action: 'save' | 'publish') => {
    if (!validate()) return;

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        categoryName: form.category,
        brand: form.brand,
        sku: form.sku.trim(),
        shortDescription: form.shortDesc.trim(),
        description: form.detailDesc.trim(),
        price: Number(form.price),
        originalPrice: Number(form.originalPrice) || Number(form.price),
        stock: Number(form.stock),
        images: form.imageUrl ? [form.imageUrl] : [],
        specifications: Object.fromEntries(
          [
            ['CPU', form.cpu],
            ['GPU', form.gpu],
            ['RAM', form.ram],
            ['SSD', form.ssd],
            ['Màn hình', form.screen],
            ['Pin', form.pin],
            ['Trọng lượng', form.weight],
          ].filter(([, v]) => String(v).trim()),
        ),
        isHot: form.isHot,
        isNew: form.isNew,
        isFeatured: form.isFeatured,
        status: _action === 'publish' ? 'active' : 'draft',
      };

      await sellerApi.createProduct(payload);

      toast({
        title: _action === 'publish' ? 'Đã đăng sản phẩm' : 'Đã lưu nháp',
        message: `"${form.name}" đã được tạo thành công.`,
        variant: 'success',
      });
      navigate('/seller/products');
    } catch (err) {
      console.error('Create product failed:', err);
      toast({
        title: 'Tạo sản phẩm thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const uploadFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter(file => {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast({
          title: 'Định dạng không hỗ trợ',
          message: `"${file.name}" không phải ảnh (JPG, PNG, WEBP, GIF, AVIF).`,
          variant: 'error',
        });
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'Ảnh quá lớn',
          message: `"${file.name}" vượt quá ${Math.round(
            MAX_FILE_SIZE / 1024 / 1024,
          )}MB.`,
          variant: 'error',
        });
        return false;
      }
      return true;
    });

    if (files.length === 0) return;

    setUploading(true);
    try {
      const res = await sellerApi.uploadImages(files);
      const url = res.files[0]?.url;
      if (url) set('imageUrl', url);
      toast({
        title: 'Tải ảnh thành công',
        message: `Đã thêm ${res.files.length} ảnh.`,
        variant: 'success',
      });
    } catch (err) {
      console.error('Upload images failed:', err);
      toast({
        title: 'Tải ảnh thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer?.files?.length) void uploadFiles(e.dataTransfer.files);
  };

  return (
    <div className="create-product-page admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Đăng sản phẩm mới</h1>
          <p className="admin-page__subtitle">Tạo và đăng sản phẩm lên cửa hàng</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setPreview(!preview)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            {preview ? 'Ẩn xem trước' : 'Xem trước'}
          </button>
        </div>
      </div>

      {}
      <div className="create-product-tabs">
        <button className="create-product-tab create-product-tab--active">Thông tin cơ bản</button>
        <button className="create-product-tab" disabled>Giá & Kho hàng</button>
        <button className="create-product-tab" disabled>Hình ảnh</button>
        <button className="create-product-tab" disabled>Thông số kỹ thuật</button>
      </div>

      <div className="create-product__layout">
        {}
        <div className="create-product__form">
          <div className="admin-section">
            <div className="admin-section__header">
              <h3 className="admin-section__title">Thông tin cơ bản</h3>
            </div>
            <div className="admin-section__body">
              <div className="admin-form">
                <div className="admin-form-group">
                  <label className="admin-form-label">Tên sản phẩm <span>*</span></label>
                  <input className={`admin-form-input ${errors.name ? 'input-error' : ''}`} placeholder="VD: iPhone 16 Pro Max 256GB" value={form.name} onChange={e => set('name', e.target.value)} />
                  {errors.name && <span className="input-error-message">{errors.name}</span>}
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Danh mục <span>*</span></label>
                    <select className={`admin-form-select ${errors.category ? 'input-error' : ''}`} value={form.category} onChange={e => set('category', e.target.value)}>
                      <option value="">Chọn danh mục</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.category && <span className="input-error-message">{errors.category}</span>}
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Thương hiệu</label>
                    <select className="admin-form-select" value={form.brand} onChange={e => set('brand', e.target.value)}>
                      <option value="">Chọn thương hiệu</option>
                      {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">SKU</label>
                  <input className="admin-form-input" placeholder="Mã SKU tự động nếu để trống" value={form.sku} onChange={e => set('sku', e.target.value)} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Mô tả ngắn</label>
                  <input className="admin-form-input" placeholder="Mô tả ngắn gọn (hiển thị trên card sản phẩm)" value={form.shortDesc} onChange={e => set('shortDesc', e.target.value)} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Mô tả chi tiết</label>
                  <textarea className="admin-form-textarea" placeholder="Mô tả chi tiết sản phẩm..." rows={4} value={form.detailDesc} onChange={e => set('detailDesc', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div className="admin-section">
            <div className="admin-section__header">
              <h3 className="admin-section__title">Giá & Kho hàng</h3>
            </div>
            <div className="admin-section__body">
              <div className="admin-form">
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Giá bán (VNĐ) <span>*</span></label>
                    <input type="number" className={`admin-form-input ${errors.price ? 'input-error' : ''}`} placeholder="VD: 29990000" value={form.price} onChange={e => set('price', e.target.value)} />
                    {errors.price && <span className="input-error-message">{errors.price}</span>}
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Giá gốc (VNĐ)</label>
                    <input type="number" className="admin-form-input" placeholder="Giá trước khi giảm" value={form.originalPrice} onChange={e => set('originalPrice', e.target.value)} />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Số lượng tồn kho <span>*</span></label>
                  <input type="number" className={`admin-form-input ${errors.stock ? 'input-error' : ''}`} placeholder="0" value={form.stock} onChange={e => set('stock', e.target.value)} />
                  {errors.stock && <span className="input-error-message">{errors.stock}</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="admin-section">
            <div className="admin-section__header">
              <h3 className="admin-section__title">Hình ảnh sản phẩm</h3>
            </div>
            <div className="admin-section__body">
              <div className="admin-form-group">
                <label className="admin-form-label">Tải ảnh từ máy</label>
                <div
                  className={`admin-product-edit__dropzone ${dragging ? 'admin-product-edit__dropzone--active' : ''}`}
                  onDragOver={e => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES.join(',')}
                    multiple
                    hidden
                    onChange={e => {
                      if (e.target.files?.length) void uploadFiles(e.target.files);
                    }}
                  />

                  {uploading ? (
                    <>
                      <Icon name="refresh" size={22} className="admin-product-edit__dropzone-spin" />
                      <p className="admin-product-edit__dropzone-title">
                        Đang tải ảnh lên…
                      </p>
                    </>
                  ) : (
                    <>
                      <Icon name="upload" size={22} />
                      <p className="admin-product-edit__dropzone-title">
                        Kéo thả ảnh vào đây hoặc bấm để chọn từ máy
                      </p>
                      <p className="admin-product-edit__dropzone-hint">
                        JPG, PNG, WEBP, GIF, AVIF — tối đa 5MB mỗi ảnh
                      </p>
                    </>
                  )}
                </div>

                {form.imageUrl && (
                  <div className="create-product__img-preview">
                    <img src={form.imageUrl} alt="Preview"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/120x120/cccccc/999999?text=Invalid+URL'; }} />
                  </div>
                )}
              </div>

              <div className="admin-form-group admin-product-edit__url-group">
                <label className="admin-form-label">Hoặc dán URL hình ảnh</label>
                <input className="admin-form-input" placeholder="Dán URL hình ảnh sản phẩm" value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="admin-section">
            <div className="admin-section__header">
              <h3 className="admin-section__title">Thông số kỹ thuật</h3>
            </div>
            <div className="admin-section__body">
              <div className="admin-form">
                <div className="admin-form-row">
                  {([['cpu', 'CPU'], ['gpu', 'GPU'], ['ram', 'RAM'], ['ssd', 'Ổ cứng SSD']] as [keyof ProductForm, string][]).map(([key, label]) => (
                    <div key={key} className="admin-form-group">
                      <label className="admin-form-label">{label}</label>
                      <input className="admin-form-input" placeholder={`VD: Intel Core i9`} value={String(form[key])} onChange={e => set(key, e.target.value)} />
                    </div>
                  ))}
                </div>
                <div className="admin-form-row">
                  {([['screen', 'Màn hình'], ['pin', 'Pin'], ['weight', 'Trọng lượng']] as [keyof ProductForm, string][]).map(([key, label]) => (
                    <div key={key} className="admin-form-group">
                      <label className="admin-form-label">{label}</label>
                      <input className="admin-form-input" placeholder={`VD: 15.6 inch`} value={String(form[key])} onChange={e => set(key, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {}
          <div className="admin-section">
            <div className="admin-section__header">
              <h3 className="admin-section__title">Gắn thẻ sản phẩm</h3>
            </div>
            <div className="admin-section__body">
              <div className="create-product__tags">
                {[
                  { key: 'isHot', label: 'Hot - Sản phẩm hot', icon: 'flash' as const },
                  { key: 'isNew', label: 'Mới - Sản phẩm mới', icon: 'sparkles' as const },
                  { key: 'isFeatured', label: 'Nổi bật - Sản phẩm nổi bật', icon: 'star' as const },
                ].map(t => (
                  <label key={t.key} className={`create-product__tag ${form[t.key as keyof ProductForm] ? 'create-product__tag--active' : ''}`}>
                    <input type="checkbox" checked={!!form[t.key as keyof ProductForm]} onChange={e => set(t.key as keyof ProductForm, e.target.checked)} />
                    <Icon name={t.icon} size={13} />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {}
          <div className="create-product__actions">
            <button className="btn btn-secondary" onClick={() => handleSubmit('save')} disabled={saving}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Lưu nháp
            </button>
            <button className="btn btn-primary" onClick={() => handleSubmit('publish')} disabled={saving}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              {saving ? 'Đang lưu…' : 'Đăng bán ngay'}
            </button>
          </div>
        </div>

        {}
        {preview && (
          <div className="create-product__preview">
            <div className="admin-section">
              <div className="admin-section__header">
                <h3 className="admin-section__title">Xem trước sản phẩm</h3>
              </div>
              <div className="admin-section__body">
                <div className="create-product-preview-card">
                  {form.imageUrl && (
                    <img src={form.imageUrl} alt={form.name} className="create-product-preview-card__img"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x300/cccccc/999999?text=No+Image'; }} />
                  )}
                  <div className="create-product-preview-card__body">
                    {form.category && <span className="badge badge-dark">{form.category}</span>}
                    {form.isHot && <span className="badge badge-danger">Hot</span>}
                    {form.isNew && <span className="badge badge-success">Mới</span>}
                    <h4 className="create-product-preview-card__name">{form.name || 'Tên sản phẩm'}</h4>
                    {form.price && <p className="create-product-preview-card__price">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(form.price))}</p>}
                    <p className="create-product-preview-card__desc">{form.shortDesc || 'Mô tả ngắn sản phẩm...'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
