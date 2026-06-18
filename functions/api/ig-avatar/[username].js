// Cloudflare Pages Function — proxies Instagram profile picture
// Deployed at: /api/ig-avatar/:username
// CF edge → Instagram CDN works fine; browser → Instagram CDN gets blocked

const UAS = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
];
const APP_IDS = ['936619743392459', '1217981644879628'];
function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function getPicUrl(username) {
  const res = await fetch(
    `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
    {
      headers: {
        'User-Agent': rnd(UAS),
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'x-ig-app-id': rnd(APP_IDS),
        'x-requested-with': 'XMLHttpRequest',
        'Referer': `https://www.instagram.com/${username}/`,
        'Origin': 'https://www.instagram.com',
      },
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const u = data?.data?.user;
  return u?.profile_pic_url_hd || u?.profile_pic_url || null;
}

export async function onRequestGet(context) {
  const username = (context.params.username || '')
    .replace(/^@+/, '').trim().toLowerCase();

  if (!username || !/^[a-z0-9._]{1,30}$/.test(username)) {
    return new Response('Invalid username', { status: 400 });
  }

  try {
    const picUrl = await getPicUrl(username);
    if (!picUrl) return new Response('Not found', { status: 404 });

    // Proxy the actual image bytes
    const imgRes = await fetch(picUrl, {
      headers: {
        'User-Agent': rnd(UAS),
        'Referer': 'https://www.instagram.com/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });

    if (!imgRes.ok) return new Response('Image fetch failed', { status: 502 });

    return new Response(imgRes.body, {
      headers: {
        'Content-Type': imgRes.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return new Response('Error: ' + e.message, { status: 500 });
  }
}
