import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, ExternalLink, Folder } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category_id: string;
  category_name?: string;
  category_icon?: string;
  link_type: string;
}

export default function SearchLinks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return;

    setLoading(true);
    setSearched(true);

    try {
      // 搜索链接
      const { data: links, error } = await supabase
        .from('links')
        .select(`
          id,
          title,
          url,
          description,
          category_id,
          link_type,
          categories (
            name,
            icon
          )
        `)
        .eq('user_id', user.id)
        .or(`title.ilike.%${searchQuery}%,url.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedResults: SearchResult[] = (links || []).map((link: {
        id: string;
        title: string;
        url: string;
        description: string | null;
        category_id: string;
        link_type: string;
        categories: { name: string; icon: string } | null;
      }) => ({
        id: link.id,
        title: link.title,
        url: link.url,
        description: link.description,
        category_id: link.category_id,
        category_name: link.categories?.name,
        category_icon: link.categories?.icon,
        link_type: link.link_type,
      }));

      setResults(formattedResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/5 to-secondary/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回首页
        </Button>

        <div className="space-y-6">
          {/* 搜索框 */}
          <Card>
            <CardContent className="p-6">
              <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Search className="w-6 h-6" />
                搜索链接
              </h1>
              <div className="flex gap-2">
                <Input
                  placeholder="输入标题、URL或描述进行搜索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                  autoFocus
                />
                <Button onClick={handleSearch} disabled={loading || !searchQuery.trim()}>
                  <Search className="w-4 h-4 mr-2" />
                  {loading ? '搜索中...' : '搜索'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 搜索结果 */}
          {searched && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">
                    搜索结果 ({results.length})
                  </h2>
                  {results.length > 0 && (
                    <Badge variant="outline">{searchQuery}</Badge>
                  )}
                </div>

                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    搜索中...
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">未找到相关链接</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      试试使用不同的关键词
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {results.map((result) => (
                      <Card
                        key={result.id}
                        className="hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => window.open(result.url, '_blank')}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold truncate">
                                  {result.title}
                                </h3>
                                <Badge variant="outline" className="flex-shrink-0">
                                  {result.link_type === 'miniprogram' ? '小程序' : '网页'}
                                </Badge>
                              </div>
                              <p className="text-sm text-primary hover:underline truncate mb-2">
                                {result.url}
                              </p>
                              {result.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {result.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Folder className="w-4 h-4 text-muted-foreground" />
                                {result.category_icon && (
                                  <span className="text-sm">{result.category_icon}</span>
                                )}
                                <span className="text-sm text-muted-foreground">
                                  {result.category_name}
                                </span>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 搜索提示 */}
          {!searched && (
            <Card className="bg-muted/50">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">搜索技巧</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 输入链接标题、URL或描述中的关键词</li>
                  <li>• 支持模糊搜索，无需输入完整内容</li>
                  <li>• 按回车键快速搜索</li>
                  <li>• 搜索结果最多显示50条</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
