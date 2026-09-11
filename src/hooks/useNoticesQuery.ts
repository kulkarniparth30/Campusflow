import { useQuery } from '@tanstack/react-query'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { useCampusStore } from '../store/campus'
import type { Notice } from '../types'

export function useNoticesQuery() {
  const local = useCampusStore((s) => s.notices)
  return useQuery({
    queryKey: ['notices', supabaseConfigured],
    queryFn: async (): Promise<Notice[]> => {
      if (!supabase || !supabaseConfigured) return useCampusStore.getState().notices
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Notice[]
    },
    initialData: local,
  })
}
