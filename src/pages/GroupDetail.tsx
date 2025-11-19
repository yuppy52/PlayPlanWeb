import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Group, Activity } from '../types';
import { ArrowLeft, Plus, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (groupId) {
      loadGroupData();
    }
  }, [groupId]);

  const loadGroupData = async () => {
    try {
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select()
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select()
        .eq('group_id', groupId)
        .order('datetime', { ascending: true });

      if (activitiesError) throw activitiesError;
      setActivities(activitiesData || []);
    } catch (error) {
      console.error('Error loading group:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">グループが見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">{group.name}</h1>
            <p className="text-sm text-gray-500">
              招待コード: {group.invite_code}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">遊びの予定</h2>
          <button
            onClick={() => navigate(`/groups/${groupId}/activities/new`)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            <Plus size={20} />
            新しい遊び
          </button>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">まだ遊びの予定がありません</p>
            <button
              onClick={() => navigate(`/groups/${groupId}/activities/new`)}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              最初の遊びを作成する
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                onClick={() => navigate(`/groups/${groupId}/activities/${activity.id}`)}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-6"
              >
                <h3 className="text-lg font-semibold mb-3">{activity.title}</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>
                      {format(new Date(activity.datetime), 'yyyy年M月d日(E) HH:mm', {
                        locale: ja,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>{activity.location}</span>
                  </div>
                </div>
                {activity.description && (
                  <p className="mt-3 text-sm text-gray-700 line-clamp-2">
                    {activity.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
