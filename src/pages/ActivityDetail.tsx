import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Activity, Message, ActivityParticipant, Item } from '../types';
import { ArrowLeft, Calendar, MapPin, DollarSign, Send, Plus, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function ActivityDetail() {
  const { groupId, activityId } = useParams<{ groupId: string; activityId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<ActivityParticipant[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activityId) {
      loadActivityData();
      subscribeToMessages();
    }

    return () => {
      supabase.channel(`activity-${activityId}`).unsubscribe();
    };
  }, [activityId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadActivityData = async () => {
    try {
      const { data: activityData, error: activityError } = await supabase
        .from('activities')
        .select()
        .eq('id', activityId)
        .single();

      if (activityError) throw activityError;
      setActivity(activityData);

      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('activity_id', activityId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);

      const { data: participantsData, error: participantsError } = await supabase
        .from('activity_participants')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('activity_id', activityId);

      if (participantsError) throw participantsError;
      setParticipants(participantsData || []);

      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select(`
          *,
          assignee:profiles(*)
        `)
        .eq('activity_id', activityId);

      if (itemsError) throw itemsError;
      setItems(itemsData || []);
    } catch (error) {
      console.error('Error loading activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`activity-${activityId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `activity_id=eq.${activityId}`,
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select()
            .eq('id', payload.new.user_id)
            .single();

          setMessages((prev) => [...prev, { ...payload.new, profile } as Message]);
        }
      )
      .subscribe();

    return channel;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !activityId) return;

    try {
      await supabase.from('messages').insert({
        activity_id: activityId,
        user_id: user.id,
        content: newMessage.trim(),
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !activityId) return;

    try {
      const { data, error } = await supabase
        .from('items')
        .insert({
          activity_id: activityId,
          name: newItemName.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      setItems([...items, data]);
      setNewItemName('');
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleUpdateParticipation = async (status: 'attending' | 'not_attending' | 'undecided') => {
    if (!user || !activityId) return;

    try {
      const { error } = await supabase
        .from('activity_participants')
        .upsert({
          activity_id: activityId,
          user_id: user.id,
          status,
        });

      if (error) throw error;
      loadActivityData();
    } catch (error) {
      console.error('Error updating participation:', error);
    }
  };

  const handleAssignItem = async (itemId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('items')
        .update({ assignee_id: user.id })
        .eq('id', itemId);

      if (error) throw error;
      loadActivityData();
    } catch (error) {
      console.error('Error assigning item:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">遊びが見つかりません</div>
      </div>
    );
  }

  const currentUserParticipation = participants.find((p) => p.user_id === user?.id);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(`/groups/${groupId}`)}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{activity.title}</h1>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full">
        <aside className="w-full md:w-80 bg-white border-r overflow-y-auto">
          <div className="p-4 space-y-6">
            <div>
              <h3 className="font-semibold mb-3">詳細情報</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Calendar size={16} className="mt-0.5 flex-shrink-0" />
                  <span>
                    {format(new Date(activity.datetime), 'yyyy年M月d日(E) HH:mm', {
                      locale: ja,
                    })}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{activity.location}</span>
                </div>
                {activity.cost && (
                  <div className="flex items-start gap-2">
                    <DollarSign size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{activity.cost.toLocaleString()}円</span>
                  </div>
                )}
              </div>
              {activity.description && (
                <p className="mt-3 text-sm text-gray-700">{activity.description}</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-3">参加状況</h3>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => handleUpdateParticipation('attending')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
                    currentUserParticipation?.status === 'attending'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Check size={16} className="inline mr-1" />
                  参加
                </button>
                <button
                  onClick={() => handleUpdateParticipation('not_attending')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
                    currentUserParticipation?.status === 'not_attending'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <X size={16} className="inline mr-1" />
                  不参加
                </button>
              </div>
              <div className="space-y-1 text-sm">
                {participants
                  .filter((p) => p.status === 'attending')
                  .map((p) => (
                    <div key={p.user_id} className="text-green-700">
                      <Check size={14} className="inline mr-1" />
                      {p.profile?.display_name}
                    </div>
                  ))}
                {participants
                  .filter((p) => p.status === 'not_attending')
                  .map((p) => (
                    <div key={p.user_id} className="text-red-700">
                      <X size={14} className="inline mr-1" />
                      {p.profile?.display_name}
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">持ち物</h3>
              <form onSubmit={handleAddItem} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="持ち物を追加"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus size={16} />
                </button>
              </form>
              <div className="space-y-2 text-sm">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span>{item.name}</span>
                    {item.assignee_id ? (
                      <span className="text-xs text-gray-600">
                        {item.assignee?.display_name}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAssignItem(item.id)}
                        className="text-xs text-indigo-600 hover:text-indigo-700"
                      >
                        担当する
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-white">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.user_id === user?.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.user_id !== user?.id && (
                    <div className="text-xs font-semibold mb-1">
                      {message.profile?.display_name}
                    </div>
                  )}
                  <div className="break-words">{message.content}</div>
                  <div
                    className={`text-xs mt-1 ${
                      message.user_id === user?.id ? 'text-indigo-200' : 'text-gray-500'
                    }`}
                  >
                    {format(new Date(message.created_at), 'HH:mm')}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="メッセージを入力..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
