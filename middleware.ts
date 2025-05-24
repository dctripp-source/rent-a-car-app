export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicPath = path === '/' || path === '/auth/login' || path === '/auth/register';
  const token = request.cookies.get('token')?.value || '';

  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
}