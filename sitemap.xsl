<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:html="http://www.w3.org/TR/REC-html40"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <title>XML Sitemap | Invoice-Gen.net</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;family=JetBrains+Mono:wght@500;600&amp;display=swap" rel="stylesheet" />
        <style type="text/css">
          :root {
            --primary: #00c875;
            --primary-dark: #00a862;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --bg-page: #f8fafc;
            --border-color: #e2e8f0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: var(--bg-page);
            color: var(--text-main);
            padding: 40px 20px 80px;
            -webkit-font-smoothing: antialiased;
          }
          .sitemap-container {
            max-width: 1040px;
            margin: 0 auto;
          }
          .header-card {
            background: #ffffff;
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 32px 36px;
            box-shadow: 0 4px 20px -4px rgba(15, 23, 42, 0.05);
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            flex-wrap: wrap;
          }
          .brand-title {
            font-size: 1.5rem;
            font-weight: 800;
            letter-spacing: -0.02em;
            color: var(--text-main);
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .brand-badge {
            display: inline-block;
            background: rgba(0, 200, 117, 0.12);
            color: var(--primary-dark);
            font-size: 0.75rem;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 9999px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .desc {
            font-size: 0.875rem;
            color: var(--text-muted);
            margin-top: 6px;
            max-width: 620px;
            line-height: 1.5;
          }
          .stats-badge {
            background: #f1f5f9;
            border: 1px solid var(--border-color);
            padding: 10px 18px;
            border-radius: 10px;
            font-size: 0.875rem;
            font-weight: 600;
            color: #334155;
          }
          .stats-badge strong {
            color: var(--primary-dark);
            font-family: 'JetBrains Mono', monospace;
            font-size: 1rem;
          }
          .home-link-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #0f172a;
            color: #ffffff;
            text-decoration: none;
            padding: 10px 18px;
            border-radius: 10px;
            font-size: 0.875rem;
            font-weight: 700;
            transition: all 0.2s ease;
          }
          .home-link-btn:hover {
            background: #1e293b;
            transform: translateY(-1px);
          }
          .table-card {
            background: #ffffff;
            border: 1px solid var(--border-color);
            border-radius: 16px;
            box-shadow: 0 4px 20px -4px rgba(15, 23, 42, 0.05);
            overflow: hidden;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
          }
          thead tr {
            background-color: #f8fafc;
            border-bottom: 1px solid var(--border-color);
          }
          th {
            padding: 14px 20px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #475569;
          }
          tbody tr {
            border-bottom: 1px solid #f1f5f9;
            transition: background-color 0.15s ease;
          }
          tbody tr:last-child {
            border-bottom: none;
          }
          tbody tr:hover {
            background-color: #f8fafc;
          }
          td {
            padding: 14px 20px;
            font-size: 0.875rem;
            vertical-align: middle;
          }
          .url-link {
            color: #0f172a;
            text-decoration: none;
            font-weight: 600;
            transition: color 0.15s ease;
            word-break: break-all;
          }
          .url-link:hover {
            color: var(--primary);
            text-decoration: underline;
          }
          .priority-pill {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 6px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.75rem;
            font-weight: 600;
          }
          .priority-high {
            background: rgba(0, 200, 117, 0.14);
            color: #047857;
          }
          .priority-medium {
            background: #eff6ff;
            color: #1d4ed8;
          }
          .priority-normal {
            background: #f1f5f9;
            color: #64748b;
          }
          .date-cell {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.8125rem;
            color: #64748b;
          }
          .freq-cell {
            text-transform: capitalize;
            color: #475569;
            font-size: 0.8125rem;
          }
          .footer-note {
            text-align: center;
            margin-top: 24px;
            font-size: 0.8125rem;
            color: #94a3b8;
          }
          .footer-note a {
            color: #64748b;
            text-decoration: none;
          }
          .footer-note a:hover {
            color: var(--primary-dark);
          }
          @media (max-width: 768px) {
            .header-card {
              flex-direction: column;
              align-items: flex-start;
            }
            th:nth-child(3), td:nth-child(3),
            th:nth-child(4), td:nth-child(4) {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="sitemap-container">
          <div class="header-card">
            <div>
              <div class="brand-title">
                <span>Invoice-Gen<span style="color: var(--primary);">.net</span></span>
                <span class="brand-badge">XML Sitemap</span>
              </div>
              <p class="desc">
                This XML Sitemap is generated for search engines like Google, Bing, and DuckDuckGo to crawl and index all public pages of Invoice-Gen.net.
              </p>
            </div>
            <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
              <div class="stats-badge">
                Total URLs: <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></strong>
              </div>
              <a href="/" class="home-link-btn">&#8592; Back to Generator</a>
            </div>
          </div>

          <div class="table-card">
            <table>
              <thead>
                <tr>
                  <th style="width: 55%;">Page URL</th>
                  <th style="width: 15%;">Priority</th>
                  <th style="width: 15%;">Change Freq</th>
                  <th style="width: 15%;">Last Modified</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:urlset/sitemap:url">
                  <tr>
                    <td>
                      <a class="url-link">
                        <xsl:attribute name="href">
                          <xsl:value-of select="sitemap:loc"/>
                        </xsl:attribute>
                        <xsl:value-of select="sitemap:loc"/>
                      </a>
                    </td>
                    <td>
                      <xsl:variable name="p" select="sitemap:priority"/>
                      <span>
                        <xsl:attribute name="class">
                          <xsl:choose>
                            <xsl:when test="$p &gt;= 0.9">priority-pill priority-high</xsl:when>
                            <xsl:when test="$p &gt;= 0.7">priority-pill priority-medium</xsl:when>
                            <xsl:otherwise>priority-pill priority-normal</xsl:otherwise>
                          </xsl:choose>
                        </xsl:attribute>
                        <xsl:value-of select="sitemap:priority"/>
                      </span>
                    </td>
                    <td class="freq-cell">
                      <xsl:value-of select="sitemap:changefreq"/>
                    </td>
                    <td class="date-cell">
                      <xsl:value-of select="sitemap:lastmod"/>
                    </td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>

          <div class="footer-note">
            &#169; 2016-2026 <a href="/">Invoice-Gen.net</a> &#8226; All rights reserved.
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
