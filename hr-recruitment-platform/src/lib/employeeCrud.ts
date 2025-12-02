import { supabase } from './supabase';

export async function callEmployeeCrud(action: string, data: any) {
  const { data: response, error } = await supabase.functions.invoke('employee-crud', {
    body: { action, data },
  });

  if (error) {
    throw new Error(`Failed to perform employee action '${action}': ${error.message}`);
  }

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data;
}
