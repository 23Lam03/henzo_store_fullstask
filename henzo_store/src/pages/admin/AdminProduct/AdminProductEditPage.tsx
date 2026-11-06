import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../../../components/common/Icon';
import { adminApi } from '../../../services/api/admin';
import { catalogApi } from '../../../services/api/catalog';
import { useToast } from '../../../contexts/ToastContext/ToastContext';
import type { Product, ProductCategory } from '../../../types';
import './AdminProductEditPage.css';

/** Định dạng ảnh được phép chọn từ máy (khớp backend). */
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

/** Dung lượng tối đa mỗi file — khớp `UPLOAD_MAX_SIZE` của backend (5MB). */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface ProductForm {
  name: string;
  categoryId: string;
  brand: string;
  sku: string;
  shortDescription: string;
  description: string;
  price: string;
  originalPrice: string;
  stock: string;
  minStock: string;
  status: 'draft' | 'active' | 'hidden';
  images: string[];
  specs: { key: string; value: string }[];
  isHot: boolean;
  isNew: boolean;
  isFeatured: boolean;
}

const EMPTY_FORM: ProductForm = {
  name: '',
  categoryId: '',
  brand: '',
  sku: '',
  shortDescription: '',
  description: '',
  price: '',
  originalPrice: '',
  stock: '',
  minStock: '10',
  status: 'active',
  images: [],
  specs: [],
  isHot: false,
  isNew: false,
  isFeatured: false,
};

const STATUS_LABELS: Record<ProductForm['status'], string> = {
  active: 'Đang bán',
  draft: 'Bản nháp',
  hidden: 'Đã ẩn',
};

export const AdminProductEditPage = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Tải dữ liệu ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [product, cats, brandList] = await Promise.all([
          adminApi.product(id),
          catalogApi.categories(),
          catalogApi.brands(),
        ]);
        if (cancelled) return;

        setCategories(cats);
        setBrands(brandList.map(b => b.name));

        const p = product as Product & {
          specifications?: Record<string, string>;
          minStock?: number;
          status?: ProductForm['status'];
        };

        setForm({
          name: p.name ?? '',
          categoryId: p.categoryId ?? '',
          brand: p.brand ?? '',
          sku: p.sku ?? '',
          shortDescription: p.shortDescription ?? '',
          description: p.description ?? '',
          price: String(p.price ?? ''),
          originalPrice: String(p.originalPrice ?? ''),
          stock: String(p.stock ?? 0),
          minStock: String(p.minStock ?? 10),
          status: p.status ?? 'active',
          images: p.images ?? [],
          specs: Object.entries(p.specifications ?? {}).map(([key, value]) => ({
            key,
            value,
          })),
          isHot: !!p.isHot,
          isNew: !!p.isNew,
          isFeatured: !!p.isFeatured,
        });
        setNotFound(false);
      } catch (err) {
        console.error('Load product failed:', err);
        if (!cancelled) {
          setNotFound(true);
          toast({
            title: 'Không tải được sản phẩm',
            message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
            variant: 'error',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (id) void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ─── Helpers ────────────────────────────────────────────────────────────
  const set = <K extends keyof ProductForm>(
    key: K,
    value: ProductForm[K],
  ) => {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key as string]) {
      setErrors(e => {
        const next = { ...e };
        delete next[key as string];
        return next;
      });
    }
  };

  const categoryName = useMemo(
    () => categories.find(c => c.id === form.categoryId)?.name ?? '',
    [categories, form.categoryId],
  );

  const discountPreview = useMemo(() => {
    const price = Number(form.price);
    const original = Number(form.originalPrice);
    if (!price || !original || original <= price) return 0;
    return Math.round(((original - price) / original) * 100);
  }, [form.price, form.originalPrice]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Tên sản phẩm không được để trống';
    if (!form.categoryId) e.categoryId = 'Vui lòng chọn danh mục';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) {
      e.price = 'Giá bán phải lớn hơn 0';
    }
    if (form.stock === '' || isNaN(Number(form.stock)) || Number(form.stock) < 0) {
      e.stock = 'Số lượng tồn không hợp lệ';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Hành động ──────────────────────────────────────────────────────────
  const handleSave = async (status?: ProductForm['status']) => {
    if (!validate()) {
      toast({ title: 'Dữ liệu chưa hợp lệ', variant: 'warning' });
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        categoryId: form.categoryId,
        categoryName,
        brand: form.brand.trim(),
        sku: form.sku.trim(),
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        originalPrice: Number(form.originalPrice) || Number(form.price),
        stock: Number(form.stock),
        minStock: Number(form.minStock) || 0,
        status: status ?? form.status,
        images: form.images,
        isHot: form.isHot,
        isNew: form.isNew,
        isFeatured: form.isFeatured,
        specifications: Object.fromEntries(
          form.specs
            .filter(s => s.key.trim() && s.value.trim())
            .map(s => [s.key.trim(), s.value.trim()]),
        ),
      };

      await adminApi.updateProduct(id, payload);

      toast({
        title: 'Đã cập nhật sản phẩm',
        message: `"${form.name}" đã được lưu thành công.`,
        variant: 'success',
      });
      navigate('/admin/products');
    } catch (err) {
      console.error('Update product failed:', err);
      toast({
        title: 'Cập nhật thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc muốn xoá sản phẩm này?')) return;
    try {
      await adminApi.deleteProduct(id);
      toast({ title: 'Đã xoá sản phẩm', variant: 'success' });
      navigate('/admin/products');
    } catch (err) {
      toast({
        title: 'Xoá thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    }
  };

  const addImage = () => {
    const url = imageInput.trim();
    if (!url) return;
    if (form.images.includes(url)) {
      toast({ title: 'Ảnh này đã có trong danh sách', variant: 'info' });
      return;
    }
    set('images', [...form.images, url]);
    setImageInput('');
  };

  // ─── Tải ảnh từ máy ─────────────────────────────────────────────────────
  /** Kiểm tra file trước khi gửi — báo lỗi ngay, không tốn băng thông. */
  const validateFiles = (files: File[]): File[] => {
    const valid: File[] = [];

    for (const file of files) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast({
          title: 'Định dạng không hỗ trợ',
          message: `"${file.name}" không phải ảnh (JPG, PNG, WEBP, GIF, AVIF).`,
          variant: 'error',
        });
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'Ảnh quá lớn',
          message: `"${file.name}" vượt quá ${Math.round(
            MAX_FILE_SIZE / 1024 / 1024,
          )}MB.`,
          variant: 'error',
        });
        continue;
      }
      valid.push(file);
    }

    return valid;
  };

  /** Gửi ảnh lên server rồi thêm URL vào danh sách. */
  const uploadFiles = async (fileList: FileList | File[]) => {
    const files = validateFiles(Array.from(fileList));
    if (files.length === 0) return;

    setUploading(true);
    try {
      const res = await adminApi.uploadImages(files);
      const urls = res.files.map(f => f.url);
      set('images', [...form.images, ...urls]);
      toast({
        title: 'Tải ảnh thành công',
        message: `Đã thêm ${urls.length} ảnh vào sản phẩm.`,
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

  /** Mở hộp thoại chọn file từ máy. */
  const openFilePicker = () => fileInputRef.current?.click();

  /** Xử lý khi người dùng thả ảnh vào vùng kéo-thả. */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer?.files?.length) void uploadFiles(e.dataTransfer.files);
  };

  const addSpec = () =>
    set('specs', [...form.specs, { key: '', value: '' }]);

  const updateSpec = (index: number, patch: Partial<{ key: string; value: string }>) =>
    set(
      'specs',
      form.specs.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );

  const removeSpec = (index: number) =>
    set('specs', form.specs.filter((_, i) => i !== index));

  // ─── Render ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-product-edit__loading">Đang tải sản phẩm…</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="admin-page">
        <div className="admin-product-edit__loading">
          Không tìm thấy sản phẩm.
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page admin-product-edit">
      <div className="admin-page__header">
        <div>
          <button
            className="admin-product-edit__back"
            onClick={() => navigate('/admin/products')}
          >
            <Icon name="chevron-left" size={15} />
            Quay lại danh sách
          </button>
          <h1 className="admin-page__title">Chỉnh Sửa Sản Phẩm</h1>
          <p className="admin-page__subtitle">
            Cập nhật thông tin, giá bán và tồn kho của sản phẩm
          </p>
        </div>
        <div className="admin-page-header__actions">
          <button
            className="btn btn-danger-outline"
            onClick={handleDelete}
            disabled={saving}
          >
            <Icon name="trash" size={14} />
            Xoá
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleSave('draft')}
            disabled={saving}
          >
            <Icon name="doc" size={14} />
            Lưu nháp
          </button>
          <button
            className="btn btn-primary"
            onClick={() => handleSave('active')}
            disabled={saving}
          >
            <Icon name="check" size={14} />
            {saving ? 'Đang lưu…' : 'Lưu & đăng bán'}
          </button>
        </div>
      </div>

      <div className="admin-product-edit__layout">
        {/* ─── Cột chính ─────────────────────────────────────────────────── */}
        <div className="admin-product-edit__main">
          <div className="admin-section">
            <div className="admin-section__header">
              <h3 className="admin-section__title">Thông tin cơ bản</h3>
            </div>
            <div className="admin-section__body">
              <div className="admin-form">
                <div className="admin-form-group">
                  <label className="admin-form-label">
                    Tên sản phẩm <span>*</span>
                  </label>
                  <input
                    className={`admin-form-input ${errors.name ? 'input-error' : ''}`}
                    placeholder="VD: iPhone 16 Pro Max 256GB"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                  />
                  {errors.name && (
                    <span className="input-error-message">{errors.name}</span>
                  )}
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">
                      Danh mục <span>*</span>
                    </label>
                    <select
                      className={`admin-form-select ${errors.categoryId ? 'input-error' : ''}`}
                      value={form.categoryId}
                      onChange={e => set('categoryId', e.target.value)}
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && (
                      <span className="input-error-message">
                        {errors.categoryId}
                      </span>
                    )}
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Thương hiệu</label>
                    <input
                      className="admin-form-input"
                      list="admin-brand-list"
                      placeholder="VD: Apple"
                      value={form.brand}
                      onChange={e => set('brand', e.target.value)}
                    />
                    <datalist id="admin-brand-list">
                      {brands.map(b => (
                        <option key={b} value={b} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">SKU</label>
                    <input
                      className="admin-form-input"
                      placeholder="Mã SKU tự động nếu để trống"
                      value={form.sku}
                      onChange={e => set('sku', e.target.value)}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Trạng thái</label>
                    <select
                      className="admin-form-select"
                      value={form.status}
                      onChange={e =>
                        set('status', e.target.value as ProductForm['status'])
                      }
                    >
                      {(Object.keys(STATUS_LABELS) as ProductForm['status'][]).map(
                        s => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Mô tả ngắn</label>
                  <input
                    className="admin-form-input"
                    placeholder="Mô tả ngắn gọn (hiển thị trên card sản phẩm)"
                    value={form.shortDescription}
                    onChange={e => set('shortDescription', e.target.value)}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Mô tả chi tiết</label>
                  <textarea
                    className="admin-form-textarea"
                    placeholder="Mô tả chi tiết sản phẩm…"
                    rows={5}
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                  />
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
                    <label className="admin-form-label">
                      Giá bán (VNĐ) <span>*</span>
                    </label>
                    <input
                      type="number"
                      className={`admin-form-input ${errors.price ? 'input-error' : ''}`}
                      placeholder="VD: 29990000"
                      value={form.price}
                      onChange={e => set('price', e.target.value)}
                    />
                    {errors.price && (
                      <span className="input-error-message">{errors.price}</span>
                    )}
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Giá gốc (VNĐ)</label>
                    <input
                      type="number"
                      className="admin-form-input"
                      placeholder="Giá trước khi giảm"
                      value={form.originalPrice}
                      onChange={e => set('originalPrice', e.target.value)}
                    />
                    {discountPreview > 0 && (
                      <span className="admin-product-edit__hint">
                        Đang giảm {discountPreview}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">
                      Số lượng tồn kho <span>*</span>
                    </label>
                    <input
                      type="number"
                      className={`admin-form-input ${errors.stock ? 'input-error' : ''}`}
                      placeholder="0"
                      value={form.stock}
                      onChange={e => set('stock', e.target.value)}
                    />
                    {errors.stock && (
                      <span className="input-error-message">{errors.stock}</span>
                    )}
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">
                      Ngưỡng cảnh báo tồn kho
                    </label>
                    <input
                      type="number"
                      className="admin-form-input"
                      placeholder="10"
                      value={form.minStock}
                      onChange={e => set('minStock', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-section">
            <div className="admin-section__header">
              <h3 className="admin-section__title">Hình ảnh sản phẩm</h3>
              <span className="admin-section__meta">
                Ảnh đầu tiên là ảnh đại diện
              </span>
            </div>
            <div className="admin-section__body">
              {/* ─── Tải ảnh từ máy ─────────────────────────────────────── */}
              <div
                className={`admin-product-edit__dropzone ${dragging ? 'admin-product-edit__dropzone--active' : ''}`}
                onDragOver={e => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={openFilePicker}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openFilePicker();
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

              {/* ─── Thêm bằng URL ───────────────────────────────────────── */}
              <div className="admin-form-group admin-product-edit__url-group">
                <label className="admin-form-label">Hoặc thêm bằng URL</label>
                <div className="admin-product-edit__image-add">
                  <input
                    className="admin-form-input"
                    placeholder="https://example.com/product.jpg"
                    value={imageInput}
                    onChange={e => setImageInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addImage();
                      }
                    }}
                  />
                  <button className="btn btn-secondary" onClick={addImage}>
                    <Icon name="plus" size={14} />
                    Thêm
                  </button>
                </div>
              </div>

              {form.images.length > 0 && (
                <div className="admin-product-edit__images">
                  {form.images.map((img, index) => (
                    <div
                      key={`${img}-${index}`}
                      className="admin-product-edit__image"
                    >
                      <img
                        src={img}
                        alt={`Ảnh ${index + 1}`}
                        loading="lazy"
                        onError={e => {
                          (e.target as HTMLImageElement).src =
                            'https://placehold.co/120x120/cccccc/999999?text=Invalid';
                        }}
                      />
                      {index === 0 && (
                        <span className="admin-product-edit__image-badge">
                          Ảnh đại diện
                        </span>
                      )}
                        <button
                          className="admin-product-edit__image-remove"
                          onClick={() =>
                            set(
                              'images',
                              form.images.filter((_, i) => i !== index),
                            )
                          }
                          aria-label="Xoá ảnh"
                        >
                          <Icon name="close" size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          <div className="admin-section">
            <div className="admin-section__header">
              <h3 className="admin-section__title">Thông số kỹ thuật</h3>
              <button
                className="admin-product-edit__spec-add"
                onClick={addSpec}
              >
                <Icon name="plus" size={13} />
                Thêm thông số
              </button>
            </div>
            <div className="admin-section__body">
              {form.specs.length === 0 ? (
                <p className="admin-product-edit__empty">
                  Chưa có thông số nào. Bấm “Thêm thông số” để nhập CPU, RAM,
                  màn hình…
                </p>
              ) : (
                <div className="admin-product-edit__specs">
                  {form.specs.map((spec, index) => (
                    <div className="admin-product-edit__spec-row" key={index}>
                      <input
                        className="admin-form-input"
                        placeholder="Tên (VD: CPU)"
                        value={spec.key}
                        onChange={e => updateSpec(index, { key: e.target.value })}
                      />
                      <input
                        className="admin-form-input"
                        placeholder="Giá trị (VD: Apple A18 Pro)"
                        value={spec.value}
                        onChange={e =>
                          updateSpec(index, { value: e.target.value })
                        }
                      />
                      <button
                        className="admin-product-edit__spec-remove"
                        onClick={() => removeSpec(index)}
                        aria-label="Xoá thông số"
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="admin-section">
            <div className="admin-section__header">
              <h3 className="admin-section__title">Gắn thẻ sản phẩm</h3>
            </div>
            <div className="admin-section__body">
              <div className="create-product__tags">
                {[
                  {
                    key: 'isHot' as const,
                    label: 'Hot — Sản phẩm bán chạy',
                    icon: 'flash' as const,
                  },
                  {
                    key: 'isNew' as const,
                    label: 'Mới — Sản phẩm mới về',
                    icon: 'sparkles' as const,
                  },
                  {
                    key: 'isFeatured' as const,
                    label: 'Nổi bật — Sản phẩm được chọn',
                    icon: 'star' as const,
                  },
                ].map(t => (
                  <label
                    key={t.key}
                    className={`create-product__tag ${form[t.key] ? 'create-product__tag--active' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={form[t.key]}
                      onChange={e => set(t.key, e.target.checked)}
                    />
                    <Icon name={t.icon} size={13} />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Cột xem trước ────────────────────────────────────────────── */}
        <aside className="admin-product-edit__aside">
          <div className="admin-section">
            <div className="admin-section__header">
              <h3 className="admin-section__title">Xem trước</h3>
            </div>
            <div className="admin-section__body">
              <div className="admin-product-edit__preview">
                {form.images[0] ? (
                  <img
                    src={form.images[0]}
                    alt={form.name}
                    className="admin-product-edit__preview-img"
                    onError={e => {
                      (e.target as HTMLImageElement).src =
                        'https://placehold.co/300x300/cccccc/999999?text=No+Image';
                    }}
                  />
                ) : (
                  <div className="admin-product-edit__preview-empty">
                    <Icon name="package" size={22} />
                    Chưa có ảnh
                  </div>
                )}
                <div className="admin-product-edit__preview-body">
                  {categoryName && (
                    <span className="badge badge-dark">{categoryName}</span>
                  )}
                  {form.isHot && <span className="badge badge-danger">Hot</span>}
                  {form.isNew && <span className="badge badge-success">Mới</span>}
                  {form.isFeatured && (
                    <span className="badge badge-primary">Nổi bật</span>
                  )}
                  <h4 className="admin-product-edit__preview-name">
                    {form.name || 'Tên sản phẩm'}
                  </h4>
                  <p className="admin-product-edit__preview-price">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                      maximumFractionDigits: 0,
                    }).format(Number(form.price) || 0)}
                  </p>
                  {discountPreview > 0 && (
                    <p className="admin-product-edit__preview-original">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                        maximumFractionDigits: 0,
                      }).format(Number(form.originalPrice) || 0)}
                      <span> −{discountPreview}%</span>
                    </p>
                  )}
                  <p className="admin-product-edit__preview-desc">
                    {form.shortDescription || 'Mô tả ngắn sản phẩm…'}
                  </p>
                  <p className="admin-product-edit__preview-stock">
                    Tồn kho: {form.stock || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
