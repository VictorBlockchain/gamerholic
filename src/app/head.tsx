export default function Head() {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Gamerholic',
    url: 'https://gamerholic.fun',
    logo: 'https://gamerholic.fun/logo.png',
  }

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: 'https://gamerholic.fun',
    name: 'Gamerholic',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://gamerholic.fun/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
    </>
  )
}