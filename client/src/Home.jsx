
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const API_URL = "http://localhost:5000/api";
const SERVER_URL = "http://localhost:5000";

function getImageUrl(image) {
    if (!image) return "";

    if (
        image.startsWith("http://") ||
        image.startsWith("https://") ||
        image.startsWith("data:")
    ) {
        return image;
    }

    return `${SERVER_URL}${image.startsWith("/") ? "" : "/"}${image}`;
}

function Home() {
    const [articles, setArticles] = useState([]);
    const [writers, setWriters] = useState([]);

    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchText, setSearchText] = useState("");

    const [loadingArticles, setLoadingArticles] = useState(true);
    const [loadingWriters, setLoadingWriters] = useState(true);

    const [articleError, setArticleError] = useState("");
    const [writerError, setWriterError] = useState("");

    // Get login token
    const token = localStorage.getItem("token");

    // Fetch real articles and suggested writers
    useEffect(() => {
        async function fetchArticles() {
            try {
                setLoadingArticles(true);

                const response = await fetch(`${API_URL}/posts`);

                if (!response.ok) {
                    throw new Error("Unable to load articles.");
                }

                const data = await response.json();
                setArticles(Array.isArray(data) ? data : []);
            } catch (error) {
                setArticleError(error.message);
            } finally {
                setLoadingArticles(false);
            }
        }

        async function fetchWriters() {
            try {
                setLoadingWriters(true);

                if (!token) {
                    setWriters([]);
                    return;
                }

                const response = await fetch(
                    `${API_URL}/profiles/suggested`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error("Unable to load suggested writers.");
                }

                const data = await response.json();
                setWriters(Array.isArray(data) ? data : []);
            } catch (error) {
                setWriterError(error.message);
            } finally {
                setLoadingWriters(false);
            }
        }

        fetchArticles();
        fetchWriters();
    }, [token]);

    // Get categories from actual articles
    const categories = [
        "All",
        ...new Set(
            articles
                .map((article) => article.blogType)
                .filter(Boolean)
                .map((category) => category.trim())
        ),
    ];

    // Filter actual articles
    const filteredArticles = articles.filter((article) => {
        const category = article.blogType || "";

        const matchesCategory =
            selectedCategory === "All" ||
            category.toLowerCase() === selectedCategory.toLowerCase();

        const search = searchText.toLowerCase().trim();

        const matchesSearch =
            (article.title || "").toLowerCase().includes(search) ||
            (article.subtitle || "").toLowerCase().includes(search) ||
            (article.authorName || "").toLowerCase().includes(search) ||
            category.toLowerCase().includes(search);

        return matchesCategory && matchesSearch;
    });

    // Follow or unfollow a real writer
    async function toggleFollow(writerId) {
        try {
            const response = await fetch(
                `${API_URL}/profiles/follow/${writerId}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to update follow status.");
            }

            // Remove followed writers from suggested list
            if (data.isFollowing) {
                setWriters((previous) =>
                    previous.filter(
                        (writer) => Number(writer.id) !== Number(writerId)
                    )
                );
            } else {
                // Refresh suggestions after unfollowing
                const refreshResponse = await fetch(
                    `${API_URL}/profiles/suggested`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (refreshResponse.ok) {
                    const updatedWriters = await refreshResponse.json();
                    setWriters(updatedWriters);
                }
            }
        } catch (error) {
            alert(error.message);
        }
    }

    // Featured article
    const featuredArticle = articles.length > 0 ? articles[0] : null;

    return (
        <div className="scribbly-home bloknote-home">

            {/* Navigation bar */}
            <header className="home-navbar">
                <Link className="home-logo" to="/home">
                    Blok<span>NOte</span>
                </Link>

                <nav className="home-navigation">
                    <a href="#home">Home</a>
                    <a href="#categories">Categories</a>
                    <a href="#articles">Articles</a>
                    <a href="#writers">Writers</a>
                    <a href="#about">About</a>
                </nav>

                <div className="home-actions">
                    <button
                        type="button"
                        onClick={() => setSearchOpen(!searchOpen)}
                    >
                        Search
                    </button>

                    <Link to="/profile">
                        My Profile
                    </Link>

                    <Link className="primary-button" to="/create-post">
                        Start Writing
                    </Link>
                </div>
            </header>

            {/* Search section */}
            {searchOpen && (
                <div className="scribbly-search-overlay">
                    <div className="scribbly-search-modal">

                        <button
                            type="button"
                            className="search-close"
                            onClick={() => setSearchOpen(false)}
                            aria-label="Close search"
                        >
                            ✕
                        </button>

                        <h2>Search Articles</h2>

                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                setSearchOpen(false);

                                document
                                    .getElementById("articles")
                                    ?.scrollIntoView({ behavior: "smooth" });
                            }}
                        >
                            <input
                                type="search"
                                placeholder="Search by title, writer or category..."
                                value={searchText}
                                onChange={(event) =>
                                    setSearchText(event.target.value)
                                }
                            />

                            <button type="submit">Search</button>
                        </form>
                    </div>
                </div>
            )}

            <main>

                {/* Featured story */}
                <section className="featured-story" id="home">

                    <div className="featured-art">
                        <img
                            src={
                                featuredArticle?.imageUrl
                                    ? getImageUrl(featuredArticle.imageUrl)
                                    : "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1000&q=80"
                            }
                            alt="Featured story"
                        />
                    </div>

                    <div className="featured-info">

                        <span className="featured-category">
                            {featuredArticle
                                ? featuredArticle.blogType || "Latest Story"
                                : "Welcome to BlokNOte"}
                        </span>

                        <h1>
                            {featuredArticle
                                ? featuredArticle.title
                                : "Ideas Worth Sharing. Stories Worth Reading."}
                        </h1>

                        <p>
                            {featuredArticle
                                ? featuredArticle.subtitle ||
                                "Discover this story from our writing community."
                                : "Discover interesting stories, explore fresh ideas, and share your own thoughts with the world."}
                        </p>

                        {featuredArticle && (
                            <div className="featured-meta">
                                <span>
                                    By {featuredArticle.authorName || "Writer"}
                                </span>

                                <span>•</span>

                                <span>
                                    {featuredArticle.createdAt
                                        ? new Date(
                                            featuredArticle.createdAt
                                        ).toLocaleDateString()
                                        : ""}
                                </span>
                            </div>
                        )}

                        {featuredArticle ? (
                            <Link
                                className="read-more"
                                to={`/post/${featuredArticle.id}`}
                            >
                                Read Featured Story →
                            </Link>
                        ) : (
                            <Link className="read-more" to="/create-post">
                                Write Your First Story →
                            </Link>
                        )}
                    </div>
                </section>

                {/* Categories */}
                <section className="category-section" id="categories">

                    <div className="section-header">
                        <div>
                            <h2 className="section-heading">
                                Explore Categories
                            </h2>

                            <p className="section-description">
                                Find stories that match your interests.
                            </p>
                        </div>
                    </div>

                    <div className="category-list">
                        {categories.map((category) => (
                            <button
                                type="button"
                                key={category}
                                className={
                                    selectedCategory === category
                                        ? "active"
                                        : ""
                                }
                                onClick={() => setSelectedCategory(category)}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Articles */}
                <section className="articles-section" id="articles">

                    <div className="section-header">
                        <div>
                            <h2 className="section-heading">
                                Latest Articles
                            </h2>

                            <p className="section-description">
                                Read the latest stories from our community.
                            </p>
                        </div>

                        <a
                            className="section-link"
                            href="#articles"
                            onClick={() => {
                                setSelectedCategory("All");
                                setSearchText("");
                            }}
                        >
                            View all articles →
                        </a>
                    </div>

                    <div className="article-grid">

                        {loadingArticles ? (
                            <div className="empty-state">
                                <p>Loading articles...</p>
                            </div>
                        ) : articleError ? (
                            <div className="empty-state">
                                <h3>Unable to load articles</h3>
                                <p>{articleError}</p>
                            </div>
                        ) : filteredArticles.length > 0 ? (

                            filteredArticles.map((article) => (
                                <Link
                                    className="article-card"
                                    key={article.id}
                                    to={`/post/${article.id}`}
                                >
                                    <div className="article-image">
                                        {article.imageUrl ? (
                                            <img
                                                src={getImageUrl(article.imageUrl)}
                                                alt={article.title}
                                            />
                                        ) : (
                                            <div className="article-placeholder">
                                                BlokNOte
                                            </div>
                                        )}
                                    </div>

                                    <div className="article-content">

                                        <span className="article-category">
                                            {article.blogType || "Article"}
                                        </span>

                                        <h3>{article.title}</h3>

                                        <p>
                                            {article.subtitle ||
                                                "Discover this story from our community."}
                                        </p>

                                        <div className="article-meta">
                                            <div className="article-author">
                                                <span>
                                                    {article.authorName ||
                                                        "Writer"}
                                                </span>
                                            </div>

                                            <span>
                                                {article.createdAt
                                                    ? new Date(
                                                        article.createdAt
                                                    ).toLocaleDateString()
                                                    : ""}
                                            </span>
                                        </div>

                                        <span className="read-more">
                                            Read Article →
                                        </span>
                                    </div>
                                </Link>
                            ))

                        ) : (
                            <div className="empty-state">
                                <h3>No articles found</h3>

                                <p>
                                    {articles.length === 0
                                        ? "No stories have been published yet."
                                        : "Try another search or select a different category."}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchText("");
                                        setSelectedCategory("All");
                                    }}
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Suggested writers */}
                <section
                    className="suggested-writers-section"
                    id="writers"
                >
                    <div className="section-header">
                        <div>
                            <h2 className="section-heading">
                                Meet Our Writers
                            </h2>

                            <p className="section-description">
                                Discover people sharing their knowledge and ideas.
                            </p>
                        </div>
                    </div>

                    <div className="writers-grid">

                        {loadingWriters ? (
                            <div className="empty-state">
                                <p>Loading writers...</p>
                            </div>
                        ) : writerError ? (
                            <div className="empty-state">
                                <p>{writerError}</p>
                            </div>
                        ) : writers.length > 0 ? (

                            writers.map((writer) => (
                                <article
                                    className="writer-card"
                                    key={writer.id}
                                >
                                    <Link to={`/user/${writer.username}`}>
                                        {writer.profilePic ? (
                                            <img
                                                src={getImageUrl(
                                                    writer.profilePic
                                                )}
                                                alt={writer.name}
                                            />
                                        ) : (
                                            <div className="writer-placeholder">
                                                {writer.name
                                                    ?.charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                        )}

                                        <h3>{writer.name}</h3>
                                    </Link>

                                    <p>
                                        {writer.bio ||
                                            "A member of the BlokNOte community."}
                                    </p>

                                    <span className="writer-post-count">
                                        {writer.postCount}{" "}
                                        {writer.postCount === 1
                                            ? "Article"
                                            : "Articles"}
                                    </span>

                                    <button
                                        type="button"
                                        className="follow-button"
                                        onClick={() =>
                                            toggleFollow(writer.id)
                                        }
                                    >
                                        Follow
                                    </button>

                                    <Link to={`/user/${writer.username}`}>
                                        View Profile →
                                    </Link>
                                </article>
                            ))

                        ) : (
                            <div className="empty-state">
                                <h3>No suggested writers</h3>

                                <p>
                                    New writers will appear here as they join
                                    the community.
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* About */}
                <section className="about-section" id="about">
                    <div>
                        <h2>About BlokNOte</h2>

                        <p>
                            BlokNOte is a space where people can explore ideas,
                            learn from different perspectives, and enjoy reading
                            meaningful stories.
                        </p>

                        <p>
                            Share your thoughts, publish your stories, and
                            discover what others have to say.
                        </p>
                    </div>

                    <img
                        src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80"
                        alt="A workspace prepared for writing"
                    />
                </section>

                {/* Writing banner */}
                <section className="write-banner" id="write">
                    <div>
                        <h2>Have a Story to Share?</h2>

                        <p>
                            Every great idea starts with a few words.
                            Take the first step and become part of our writing community.
                        </p>
                    </div>

                    <Link to="/create-post">
                        Start Writing →
                    </Link>
                </section>

            </main>

            {/* Footer */}
            <footer className="home-footer">

                <div className="footer-main">

                    <div className="footer-brand">
                        <Link className="home-logo" to="/home">
                            Blok<span>NOte</span>
                        </Link>

                        <p>
                            A place for ideas, stories, creativity, and learning.
                        </p>
                    </div>

                    <div>
                        <h4>Explore</h4>

                        <div className="footer-links">
                            <a href="#home">Home</a>
                            <a href="#categories">Categories</a>
                            <a href="#articles">Articles</a>
                        </div>
                    </div>

                    <div>
                        <h4>Community</h4>

                        <div className="footer-links">
                            <a href="#writers">Our Writers</a>
                            <a href="#about">About Us</a>
                            <Link to="/create-post">Start Writing</Link>
                            <Link to="/profile">My Profile</Link>
                        </div>
                    </div>

                </div>

                <div className="footer-bottom">
                    <span>© 2026 BlokNOte. All rights reserved.</span>
                    <span>Made for people who love stories.</span>
                </div>

            </footer>
        </div>
    );
}

export default Home;
