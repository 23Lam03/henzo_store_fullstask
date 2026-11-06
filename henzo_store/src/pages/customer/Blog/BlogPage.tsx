import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { catalogApi } from '../../../services/api/catalog';
import type { Blog } from '../../../types';
import './BlogPage.css';

export const BlogPage = () => {
  const [posts, setPosts] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Tất cả');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await catalogApi.blogs({ pageSize: 50 });
        if (!cancelled && Array.isArray(res)) setPosts(res);
      } catch (err) {
        console.error('Load blogs failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Danh mục lấy động từ dữ liệu blog trả về. */
  const categories = useMemo(
    () => ['Tất cả', ...Array.from(new Set(posts.map(p => p.category).filter(Boolean)))],
    [posts],
  );

  const filtered = useMemo(
    () =>
      activeCategory === 'Tất cả'
        ? posts
        : posts.filter(p => p.category === activeCategory),
    [posts, activeCategory],
  );

  const [featured, ...rest] = filtered;

  return (
    <div className="blog-page container">
      <div className="page-header">
        <h1 className="page-header__title">Blog Công Nghệ</h1>
        <p className="page-header__subtitle">Tin tức, đánh giá và hướng dẫn công nghệ mới nhất</p>
      </div>

      <div className="blog-categories">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`blog-category-btn ${cat === activeCategory ? 'blog-category-btn--active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="blog-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="blog-card card blog-card--skeleton" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="blog-empty">Chưa có bài viết nào.</p>
      ) : (
        <>
          {featured && (
            <div className="blog-featured">
              <Link to={`${ROUTES.BLOG_DETAIL.replace(':slug', featured.slug)}`} className="blog-featured-card">
                <div
                  className="blog-featured-card__image"
                  style={featured.thumbnail ? { backgroundImage: `url(${featured.thumbnail})` } : undefined}
                />
                <div className="blog-featured-card__content">
                  <span className="blog-featured-card__category">{featured.category}</span>
                  <h2 className="blog-featured-card__title">{featured.title}</h2>
                  <p className="blog-featured-card__excerpt">{featured.excerpt}</p>
                  <div className="blog-featured-card__meta">
                    <span>{featured.author}</span>
                    <span>•</span>
                    <span>{new Date(featured.createdAt).toLocaleDateString('vi-VN')}</span>
                    <span>•</span>
                    <span>{featured.views.toLocaleString()} lượt xem</span>
                  </div>
                </div>
              </Link>
            </div>
          )}

          <div className="blog-grid">
            {rest.map(post => (
              <Link
                key={post.id}
                to={`${ROUTES.BLOG_DETAIL.replace(':slug', post.slug)}`}
                className="blog-card card"
              >
                <div
                  className="blog-card__image"
                  style={post.thumbnail ? { backgroundImage: `url(${post.thumbnail})` } : undefined}
                >
                  <span className="blog-card__category">{post.category}</span>
                </div>
                <div className="blog-card__body">
                  <h3 className="blog-card__title">{post.title}</h3>
                  <p className="blog-card__excerpt">{post.excerpt}</p>
                  <div className="blog-card__meta">
                    <span>{post.author}</span>
                    <span>•</span>
                    <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                    <span>•</span>
                    <span>{post.views.toLocaleString()} lượt xem</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
