import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function IndexPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'super_admin') {
    redirect('/d105')
  } else {
    redirect('/fichaje')
  }
}
