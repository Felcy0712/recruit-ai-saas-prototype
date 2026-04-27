export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch(process.env.NEXT_PUBLIC_N8N_EMAIL_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: 'Failed to send email' }, { status: 500 });
  }
}