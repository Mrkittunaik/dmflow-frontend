// Cloudflare Pages Function — runs on CF edge (not Render)
// Instagram doesn't block Cloudflare IPs → scrape works reliably
// Deployed at: /api/ig-lookup?username=xxx

const UAS = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/319.0.638.2 Mobile/15E148 Safari/604.1',
];
const APP_IDS = ['936619743392459', '1217981644879628', '124024574287414'];

function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function buildProfile(u, username) {
  const isBusinessOrCreator =
    !!(u.is_business_account || u.is_professional_account ||
    ['BUSINESS', 'CREATOR', 'MEDIA_CREATOR'].includes((u.account_type || '').toUpperCase()));

  return {
    found: true,
    username: u.username || username,
    fullName: u.full_name || '',
    profilePic: u.profile_pic_url_hd || u.profile_pic_url || '',
    followers: u.edge_followed_by?.count ?? u.follower_count ?? 0,
    following: u.edge_follow?.count ?? u.following_count ?? 0,
    posts: u.edge_owner_to_timeline_media?.count ?? u.media_count ?? 0,
    biography: u.biography || '',
    isVerified: u.is_verified || false,
    isPrivate: u.is_private || false,
    isBusinessOrCreator,
    category: u.category_name || u.category || '',
    accountType: u.account_type || (isBusinessOrCreator ? 'BUSINESS' : 'PERSONAL'),
  };
}

async function tryWebAPI(username) {
  const res = await fetch(
    `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
    {
      headers: {
        'User-Agent': rnd(UAS),
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'x-ig-app-id': rnd(APP_IDS),
        'x-requested-with': 'XMLHttpRequest',
        'x-asbd-id': '198387',
        'x-csrftoken': 'missing',
        'Referer': `https://www.instagram.com/${username}/`,
        'Origin': 'https://www.instagram.com',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
      },
      cf: { cacheTtl: 300, cacheEverything: false },
    }
  );
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  const u = data?.data?.user;
  if (!u) throw new Error('No user data');
  return buildProfile(u, username);
}

async function tryGraphQL(username) {
  const res = await fetch(
    `https://www.instagram.com/${encodeURIComponent(username)}/?__a=1&__d=dis`,
    {
      headers: {
        'User-Agent': rnd(UAS),
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Referer': 'https://www.instagram.com/',
        'X-Requested-With': 'XMLHttpRequest',
      },
    }
  );
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  const u = data?.graphql?.user || data?.data?.user;
  if (!u) throw new Error('No user data');
  return buildProfile(u, username);
}

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const username = (url.searchParams.get('username') || '')
    .replace(/^@+/, '').trim().toLowerCase();

  if (!username || !/^[a-z0-9._]{1,30}$/.test(username)) {
    return new Response(JSON.stringify({ error: 'Invalid username' }), {
      status: 400, headers: JSON_HEADERS,
    });
  }

  // Try both strategies — race them
  try {
    const profile = await Promise.any([
      tryWebAPI(username),
      tryGraphQL(username),
    ]);
    return new Response(JSON.stringify(profile), {
      headers: { ...JSON_HEADERS, 'Cache-Control': 'public, max-age=300' },
    });
  } catch (_) {
    // Both failed
    return new Response(
      JSON.stringify({ found: false, username, followers: 0, following: 0, posts: 0, isBusinessOrCreator: null }),
      { headers: JSON_HEADERS }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
    },
  });
}
