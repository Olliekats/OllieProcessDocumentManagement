import { supabase } from '../lib/supabase';

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category_id?: string;
  created_by: string;
  created_at: string;
}

export interface SOPDocument {
  id: string;
  title: string;
  content: string;
  version: string;
  status: string;
  created_at: string;
}

export async function getKnowledgeArticles(categoryId?: string) {
  let query = supabase
    .from('knowledge_articles')
    .select(`
      *,
      knowledge_categories(name),
      users_profile!knowledge_articles_created_by_fkey(full_name)
    `)
    .order('created_at', { ascending: false });

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getKnowledgeCategories() {
  const { data, error } = await supabase
    .from('knowledge_categories')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function createKnowledgeArticle(
  title: string,
  content: string,
  categoryId: string
) {
  const user = (await supabase.auth.getUser()).data.user;

  const { data, error } = await supabase
    .from('knowledge_articles')
    .insert({
      title,
      content,
      category_id: categoryId,
      created_by: user?.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateKnowledgeArticle(
  id: string,
  title: string,
  content: string,
  categoryId: string
) {
  const { error } = await supabase
    .from('knowledge_articles')
    .update({
      title,
      content,
      category_id: categoryId
    })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteKnowledgeArticle(id: string) {
  const { error } = await supabase
    .from('knowledge_articles')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function incrementArticleView(id: string) {
  const { data: article } = await supabase
    .from('knowledge_articles')
    .select('view_count')
    .eq('id', id)
    .single();

  if (article) {
    await supabase
      .from('knowledge_articles')
      .update({ view_count: (article.view_count || 0) + 1 })
      .eq('id', id);
  }
}

export async function voteArticleHelpful(articleId: string, isHelpful: boolean) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;

  const { error } = await supabase
    .from('knowledge_votes')
    .upsert({
      article_id: articleId,
      user_id: user.id,
      is_helpful: isHelpful
    });

  if (error) throw error;

  const { data: votes } = await supabase
    .from('knowledge_votes')
    .select('is_helpful')
    .eq('article_id', articleId);

  if (votes) {
    const helpfulCount = votes.filter(v => v.is_helpful).length;
    await supabase
      .from('knowledge_articles')
      .update({ helpful_count: helpfulCount })
      .eq('id', articleId);
  }
}

export async function searchKnowledge(searchTerm: string) {
  const { data, error } = await supabase
    .from('knowledge_articles')
    .select('*')
    .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
    .limit(20);

  if (error) throw error;
  return data || [];
}

export async function getSOPs(status?: string) {
  let query = supabase
    .from('sops')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createSOP(
  title: string,
  content: string,
  version: string = '1.0'
) {
  const user = (await supabase.auth.getUser()).data.user;

  const { data, error } = await supabase
    .from('sops')
    .insert({
      title,
      content,
      version,
      status: 'draft',
      created_by: user?.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSOP(
  id: string,
  title: string,
  content: string,
  version: string,
  status: string
) {
  const { error } = await supabase
    .from('sops')
    .update({
      title,
      content,
      version,
      status
    })
    .eq('id', id);

  if (error) throw error;
}

export async function publishSOP(id: string) {
  const { error } = await supabase
    .from('sops')
    .update({ status: 'published' })
    .eq('id', id);

  if (error) throw error;
}

export async function linkSOPToProcess(sopId: string, processId: string, nodeId?: string) {
  const { error } = await supabase
    .from('sops')
    .update({
      process_id: processId,
      node_id: nodeId
    })
    .eq('id', sopId);

  if (error) throw error;
}

export async function getProcessDocumentation(processId: string) {
  const { data, error } = await supabase
    .from('sops')
    .select('*')
    .eq('process_id', processId)
    .eq('status', 'published');

  if (error) throw error;
  return data || [];
}
