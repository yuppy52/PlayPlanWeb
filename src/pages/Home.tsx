import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Group } from '../types';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, LogOut } from 'lucide-react';

export default function Home() {
  const { user, signOut } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_members!inner(user_id)
        `)
        .eq('group_members.user_id', user?.id);

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">PlayPlan</h1>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <LogOut size={20} />
            ログアウト
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">マイグループ</h2>
          <button
            onClick={() => navigate('/groups/new')}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            <Plus size={20} />
            新規作成
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">読み込み中...</div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">
              まだグループがありません
            </p>
            <button
              onClick={() => navigate('/groups/new')}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              最初のグループを作成する
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <div
                key={group.id}
                onClick={() => navigate(`/groups/${group.id}`)}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-6"
              >
                <h3 className="text-lg font-semibold mb-2">{group.name}</h3>
                <p className="text-sm text-gray-500">
                  招待コード: {group.invite_code}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
