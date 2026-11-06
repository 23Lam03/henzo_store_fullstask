import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { catalogApi } from '../../../services/api/catalog';
import { ProductCard } from '../../../components/common/ProductCard';
import { Icon, type IconName } from '../../../components/common/Icon';
import { Reveal, RevealGroup } from '../../../components/common/Reveal';
import { bannerUrl } from '../../../utils/assets';
import type { Product, ProductCategory, Brand } from '../../../types';
import './HomePage.css';

const ICON_BY_SLUG: Record<string, IconName> = {
  'dien-thoai': 'phone',
  laptop: 'laptop',
  'pc-gaming': 'desktop',
  'man-hinh': 'monitor',
  chuot: 'mouse',
  'ban-phim': 'keyboard',
  'tai-nghe': 'headphones',
  'phu-kien': 'plug',
};

const BANNERS = [
  {
    image: bannerUrl('iphone16-pro-max.jpg'),
    eyebrow: 'Dòng iPhone mới',
    title: 'iPhone 16 Pro Max',
    subtitle: 'Giảm đến 3 triệu · Bảo hành chính hãng tới 24 tháng',
    price: 'Từ 27.990.000₫',
    cta: 'Khám phá ngay',
  },
  {
    image: bannerUrl('macbook-pro-m4.jpg'),
    eyebrow: 'Workstation di động',
    title: 'MacBook Pro M4',
    subtitle: 'Ưu đãi đặc biệt · Trả góp 0% không giới hạn thời hạn',
    price: 'Từ 39.990.000₫',
    cta: 'Xem cấu hình',
  },
  {
    image: bannerUrl('razer-deathadder.jpg'),
    eyebrow: 'Gaming gear',
    title: 'Razer DeathAdder V3',
    subtitle: 'Giảm 30% chuột, bàn phím, tai nghe cho hệ sinh thái Razer',
    price: 'Từ 1.290.000₫',
    cta: 'Săn deal',
  },
];

export const HomePage = () => {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [hot, setHot] = useState<Product[]>([]);
  const [flashSale, setFlashSale] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [flashLeft, setFlashLeft] = useState(12 * 3600);
  const bannerTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {

        const [collections, catList, brandList] = await Promise.all([
          catalogApi.collections(),
          catalogApi.categories().catch(() => []),
          catalogApi.brands().catch(() => []),
        ]);
        setFlashSale(collections.flashSale ?? []);
        setFeatured(collections.featured ?? []);
        setHot(collections.bestSellers ?? []);
        setCategories(catList ?? []);
        setBrands(brandList ?? []);
      } catch (err) {
        console.error('Load home data failed:', err);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, []);

    useEffect(() => {
    bannerTimer.current = window.setInterval(() => {
      setBannerIdx(i => (i + 1) % BANNERS.length);
    }, 6000);
    return () => {
      if (bannerTimer.current) window.clearInterval(bannerTimer.current);
    };
  }, []);

    useEffect(() => {
    const timer = window.setInterval(() => {
      setFlashLeft(s => (s > 0 ? s - 1 : 12 * 3600));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const flashClock = {
    hours: String(Math.floor(flashLeft / 3600)).padStart(2, '0'),
    minutes: String(Math.floor((flashLeft % 3600) / 60)).padStart(2, '0'),
    seconds: String(flashLeft % 60).padStart(2, '0'),
  };

  const skeletons = (count: number) => (
    <div className="loading-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="product-skeleton" />
      ))}
    </div>
  );

  const banner = BANNERS[bannerIdx];

  return (
    <div className="home-page">
      {}
      <section className="hero" onMouseEnter={() => {
        if (bannerTimer.current) window.clearInterval(bannerTimer.current);
      }}>
        <div className="hero__body">
          <span className="hero__eyebrow" key={`ey-${bannerIdx}`}>
            {banner.eyebrow}
          </span>
          <h1 className="hero__title" key={`t-${bannerIdx}`}>
            {banner.title}
          </h1>
          <p className="hero__subtitle" key={`s-${bannerIdx}`}>
            {banner.subtitle}
          </p>
          <p className="hero__price" key={`p-${bannerIdx}`}>
            {banner.price}
          </p>

          <div className="hero__actions">
            <Link to="/products" className="btn btn-primary btn-lg">
              {banner.cta}
              <Icon name="arrow-right" size={17} />
            </Link>
            <Link to="/categories" className="btn btn-secondary btn-lg">
              Danh mục
            </Link>
          </div>

          <div className="hero__dots">
            {BANNERS.map((b, i) => (
              <button
                key={b.title}
                aria-label={`Chuyển đến banner ${i + 1}`}
                className={i === bannerIdx ? 'is-active' : ''}
                onClick={() => setBannerIdx(i)}
              >
                <span>{String(i + 1).padStart(2, '0')}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="hero__media">
          {BANNERS.map((b, i) => (
            <img
              key={b.image}
              src={b.image}
              alt={b.title}
              className={`hero__image ${i === bannerIdx ? 'is-active' : ''}`}
            />
          ))}
        </div>
      </section>

      {}
      <RevealGroup as="section" className="trust-strip">
        <div className="trust-strip__item">
          <Icon name="shield" size={20} />
          <div>
            <strong>Bảo hành chính hãng</strong>
            <span>Tới 24 tháng, hỗ trợ tận nơi</span>
          </div>
        </div>
        <div className="trust-strip__item">
          <Icon name="truck" size={20} />
          <div>
            <strong>Giao nhanh 2H nội thành</strong>
            <span>Miễn phí vận chuyển từ 500K</span>
          </div>
        </div>
        <div className="trust-strip__item">
          <Icon name="refresh" size={20} />
          <div>
            <strong>Đổi trả 30 ngày</strong>
            <span>Không cần lý do, hoàn tiền nhanh</span>
          </div>
        </div>
        <div className="trust-strip__item">
          <Icon name="credit-card" size={20} />
          <div>
            <strong>Trả góp 0%</strong>
            <span>Thanh toán linh hoạt qua thẻ tín dụng</span>
          </div>
        </div>
      </RevealGroup>

      {}
      <section className="manifesto">
        <Reveal direction="left" className="manifesto__body">
          <span className="manifesto__mark">&ldquo;</span>
          <h2 className="manifesto__quote">
            Chúng tôi không bán nhiều hơn — chúng tôi bán <em>đúng</em> thứ bạn cần,
            với giá xứng đáng và bảo hành còn dài hơn bạn nghĩ.
          </h2>
        </Reveal>
        <RevealGroup className="manifesto__notes">
          <div className="manifesto__note">
            <span className="manifesto__note-index">A</span>
            <p>
              Mỗi thiết bị đều truy xuất được nguồn gốc từ nhà phân phối ủy quyền
              tại Việt Nam — không hàng nhập lậu, không hàng xách tay.
            </p>
          </div>
          <div className="manifesto__note">
            <span className="manifesto__note-index">B</span>
            <p>
              Giá niêm yết trên website là giá thực tế tại quầy. Không giá ảo,
              không phí ẩn phát sinh khi thanh toán.
            </p>
          </div>
          <div className="manifesto__note">
            <span className="manifesto__note-index">C</span>
            <p>
              Kỹ thuật viên tại chuỗi cửa hàng sẵn sàng hỗ trợ cài đặt, chuyển dữ liệu
              và hướng dẫn sử dụng trong suốt thời gian sở hữu.
            </p>
          </div>
        </RevealGroup>
      </section>

      {}
      <Reveal as="section" direction="up" className="section-categories">
        <div className="section-head">
          <div className="section-head__main">
            <span className="section-head__index">01</span>
            <div>
            <h2 className="section-head__title">Danh mục sản phẩm</h2>
            <p className="section-head__desc">Khám phá hàng nghìn sản phẩm công nghệ chính hãng</p>
            </div>
          </div>
          <Link to="/categories" className="section-head__link">
            Xem tất cả
            <Icon name="arrow-right" size={16} />
          </Link>
        </div>
        <RevealGroup className="categories-grid">
          {categories.map((cat, idx) => (
            <Link key={cat.slug} to={`/categories/${cat.slug}`} className="category-item">
              <span className="category-item__num">{String(idx + 1).padStart(2, '0')}</span>
              <span className="category-item__icon">
                <Icon name={ICON_BY_SLUG[cat.slug] ?? 'package'} size={24} />
              </span>
              <span className="category-item__body">
                <span className="category-item__name">{cat.name}</span>
                <span className="category-item__count">{cat.productCount} sản phẩm</span>
              </span>
              <Icon name="chevron-right" size={16} className="category-item__arrow" />
            </Link>
          ))}
        </RevealGroup>
      </Reveal>

      {}
      <Reveal as="section" direction="up" className="section-flash-sale">
        <div className="section-head">
          <div className="section-head__main">
            <span className="section-head__index">02</span>
            <div>
            <h2 className="section-head__title section-head__title--flash">Flash Sale</h2>
            </div>
          </div>
          <div className="section-head__right">
            <span className="flash-sale__countdown">
              <Icon name="clock" size={14} />
              <span className="flash-sale__clock">
                {flashClock.hours}:{flashClock.minutes}:{flashClock.seconds}
              </span>
            </span>
            <Link to="/products" className="section-head__link">
              Xem tất cả
              <Icon name="arrow-right" size={16} />
            </Link>
          </div>
        </div>
        <div className="products-scroll">
          {loading ? skeletons(8) : flashSale.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </Reveal>

      {}
      <Reveal as="section" direction="up" className="section-featured">
        <div className="section-head">
          <div className="section-head__main">
            <span className="section-head__index">03</span>
            <div>
            <h2 className="section-head__title">Sản phẩm nổi bật</h2>
            <p className="section-head__desc">Lựa chọn được nhiều khách hàng yêu thích nhất</p>
            </div>
          </div>
          <Link to="/products" className="section-head__link">
            Xem tất cả
            <Icon name="arrow-right" size={16} />
          </Link>
        </div>
        <RevealGroup className="products-grid">
          {loading ? skeletons(8) : featured.map(p => <ProductCard key={p.id} product={p} />)}
        </RevealGroup>
      </Reveal>

      {}
      <Reveal as="section" direction="scale" className="section-banner-promo">
        <div className="promo-banner">
          <img src={bannerUrl('rog-strix-g16.jpg')} alt="Khuyến mãi cuối tuần" />
          <div className="promo-banner__content">
            <span className="promo-banner__eyebrow">Ưu đãi cuối tuần</span>
            <h2>Giảm đến 50% cho hàng ngàn sản phẩm công nghệ</h2>
            <p>Săn deal độc quyền, miễn phí vận chuyển toàn quốc</p>
            <Link to="/products" className="btn btn-light btn-lg">
              Khám phá ngay
              <Icon name="arrow-right" size={18} />
            </Link>
          </div>
        </div>
      </Reveal>

      {}
      <Reveal as="section" direction="up" className="section-hot">
        <div className="section-head">
          <div className="section-head__main">
            <span className="section-head__index">04</span>
            <div>
            <h2 className="section-head__title">Sản phẩm bán chạy</h2>
            <p className="section-head__desc">Top sản phẩm bán chạy nhất tháng này</p>
            </div>
          </div>
          <Link to="/products" className="section-head__link">
            Xem tất cả
            <Icon name="arrow-right" size={16} />
          </Link>
        </div>
        <RevealGroup className="products-grid">
          {loading ? skeletons(8) : hot.map(p => <ProductCard key={p.id} product={p} />)}
        </RevealGroup>
      </Reveal>

      {}
      <Reveal as="section" direction="up" className="section-brands">
        <div className="section-head">
          <div className="section-head__main">
            <span className="section-head__index">05</span>
            <div>
            <h2 className="section-head__title">Thương hiệu nổi bật</h2>
            <p className="section-head__desc">Đối tác chính hãng từ Apple, Samsung, Sony và nhiều hơn</p>
            </div>
          </div>
          <Link to="/brands" className="section-head__link">
            Tất cả thương hiệu
            <Icon name="arrow-right" size={16} />
          </Link>
        </div>
        {}
        <div className="hz-marquee brands-marquee">
          <div className="hz-marquee__track">
            {[...brands.slice(0, 10), ...brands.slice(0, 10)].map((brand, i) => (
              <Link
                key={`${brand.id || brand.slug}-${i}`}
                to={`/brands/${brand.slug}`}
                className="brand-item"
                aria-hidden={i >= brands.slice(0, 10).length}
                tabIndex={i >= brands.slice(0, 10).length ? -1 : 0}
              >
                {brand.logo ? (
                  <img src={brand.logo} alt={brand.name} className="brand-item__logo" />
                ) : (
                  <span>{brand.name}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </Reveal>

      {}
      <Reveal as="section" direction="up" className="section-app-cta">
        <div className="app-cta">
          <div className="app-cta__content">
            <span className="app-cta__eyebrow">Ứng dụng HenzoStore</span>
            <h2>Mua sắm nhanh hơn, theo dõi đơn ngay trên điện thoại</h2>
            <p>Nhận nhiều ưu đãi hơn, theo dõi đơn hàng và tích lũy điểm thưởng khi mua sắm qua ứng dụng</p>
            <div className="app-cta__buttons">
              <button className="btn btn-dark">
                <Icon name="download" size={18} />
                App Store
              </button>
              <button className="btn btn-dark">
                <Icon name="download" size={18} />
                Google Play
              </button>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
};
