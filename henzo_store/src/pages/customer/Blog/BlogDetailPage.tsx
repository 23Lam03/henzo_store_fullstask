import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { catalogApi } from '../../../services/api/catalog';
import { Icon } from '../../../components/common/Icon';
import type { Blog } from '../../../types';
import './BlogDetailPage.css';

export const BlogDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Blog | null>(null);
  const [related, setRelated] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await catalogApi.blog(slug);
        if (!cancelled) {
          setPost(res.post);
          setRelated(res.related ?? []);
        }
      } catch (err) {
        console.error('Load blog detail failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '80px 0' }}>
        <p>Đang tải bài viết...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '80px 0' }}>
        <h2>Bài viết không tồn tại</h2>
        <Link to={ROUTES.BLOGS} className="btn btn-primary" style={{ marginTop: '24px' }}>
          Quay lại blog
        </Link>
      </div>
    );
  }

  const paragraphs = (post.excerpt || '').split('\n\n').filter(Boolean);

  return (
    <div className="blog-detail-page">
      <div
        className="blog-detail-hero"
        style={post.thumbnail ? { backgroundImage: `url(${post.thumbnail})` } : undefined}
      >
        <div className="blog-detail-hero__overlay" />
        <div className="container blog-detail-hero__content">
          <Link to={ROUTES.BLOGS} className="blog-detail-hero__back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Blog
          </Link>
          <span className="blog-detail-hero__category">{post.category}</span>
          <h1 className="blog-detail-hero__title">{post.title}</h1>
          <div className="blog-detail-hero__meta">
            <span><Icon name="user" size={14} /> {post.author}</span>
            <span><Icon name="calendar" size={14} /> {new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
            <span><Icon name="eye" size={14} /> {post.views.toLocaleString()} lượt xem</span>
          </div>
        </div>
      </div>

      <div className="container blog-detail-layout">
        <article className="blog-detail-content">
          {paragraphs.map((para, i) => (
            <p key={i} className="blog-detail-content__paragraph">
              {para}
            </p>
          ))}
        </article>

        <aside className="blog-detail-sidebar">
          <div className="card blog-detail-author">
            <h3 className="blog-detail-author__title">Về tác giả</h3>
            <div className="blog-detail-author__info">
              <div className="blog-detail-author__avatar">{post.author?.[0] ?? 'A'}</div>
              <div>
                <p className="blog-detail-author__name">{post.author}</p>
                <p className="blog-detail-author__role">Chuyên gia công nghệ</p>
              </div>
            </div>
          </div>

          {related.length > 0 && (
            <div className="card blog-detail-related">
              <h3 className="blog-detail-related__title">Bài viết liên quan</h3>
              <div className="blog-detail-related__list">
                {related.map(p => (
                  <Link
                    key={p.id}
                    to={`${ROUTES.BLOG_DETAIL.replace(':slug', p.slug)}`}
                    className="blog-related-item"
                  >
                    <div
                      className="blog-related-item__thumb"
                      style={p.thumbnail ? { backgroundImage: `url(${p.thumbnail})` } : undefined}
                    />
                    <span className="blog-related-item__title">{p.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
