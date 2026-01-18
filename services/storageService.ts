
import { createClient } from '@supabase/supabase-js';
import { Question, QuestionSet } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const storageService = {
  // --- Questions ---
  // --- Questions ---
  getQuestions: async (): Promise<Question[]> => {
    // 1. Fetch Legacy Questions
    const legacyDetails = supabase
      .from('questions')
      .select('*')
      .order('createdDate', { ascending: false });

    // 2. Fetch New Master Questions
    const masterDetails = supabase
      .from('questions_master')
      .select('*')
      .order('created_at', { ascending: false });

    const [legacyRes, masterRes] = await Promise.all([legacyDetails, masterDetails]);

    if (legacyRes.error) console.error('Error fetching legacy questions:', legacyRes.error);
    if (masterRes.error) console.error('Error fetching master questions:', masterRes.error);

    const legacyQuestions: Question[] = legacyRes.data || [];

    // Map new schema to old Question interface
    const newQuestions: Question[] = (masterRes.data || []).map((row: any) => ({
      id: String(row.question_id), // Ensure string ID
      question_unique_id: String(row.question_id),
      question_hin: row.language_type === 'English' ? '' : row.question_text,
      question_eng: row.language_type === 'Hindi' ? '' : row.question_text,
      subject: row.subject_name || 'General',
      chapter: row.topic_name || 'General',

      option1_hin: row.option_a || '',
      option1_eng: row.option_a || '',
      option2_hin: row.option_b || '',
      option2_eng: row.option_b || '',
      option3_hin: row.option_c || '',
      option3_eng: row.option_c || '',
      option4_hin: row.option_d || '',
      option4_eng: row.option_d || '',

      answer: row.correct_answer,
      solution_hin: row.answer_explanation || '',
      solution_eng: row.answer_explanation || '',

      type: 'MCQ',
      difficulty: row.difficulty_level || 'Medium',
      language: row.language_type || 'Bilingual',
      tags: [],
      createdDate: row.created_at,
      exam: row.question_source
    }));

    // Combine both lists
    return [...legacyQuestions, ...newQuestions];
  },

  saveQuestion: async (question: Question): Promise<void> => {
    const { error } = await supabase
      .from('questions')
      .upsert(question);

    if (error) {
      console.error('Error saving question:', error);
      throw error;
    }
  },

  saveQuestionsBulk: async (newQuestions: Question[]): Promise<void> => {
    const { error } = await supabase
      .from('questions')
      .insert(newQuestions);

    if (error) {
      console.error('Error bulk saving questions:', error);
      throw error;
    }
  },

  updateQuestionsBulk: async (ids: string[], updates: Partial<Question>): Promise<void> => {
    const { error } = await supabase
      .from('questions')
      .update(updates)
      .in('id', ids);

    if (error) {
      console.error('Error bulk updating questions:', error);
      throw error;
    }
  },

  deleteQuestion: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  },

  deleteQuestionsBulk: async (ids: string[]): Promise<void> => {
    const { error } = await supabase
      .from('questions')
      .delete()
      .in('id', ids);

    if (error) {
      console.error('Error bulk deleting questions:', error);
      throw error;
    }
  },

  // --- Sets ---
  getSets: async (): Promise<QuestionSet[]> => {
    const { data, error } = await supabase
      .from('sets')
      .select('*')
      .order('createdDate', { ascending: false });

    if (error) {
      console.error('Error fetching sets:', error);
      return [];
    }
    return data || [];
  },

  getSetById: async (setId: string): Promise<QuestionSet | undefined> => {
    const { data, error } = await supabase
      .from('sets')
      .select('*')
      .eq('setId', setId)
      .single();

    if (error) {
      console.error('Error fetching set by ID:', error);
      return undefined;
    }
    return data;
  },

  saveSet: async (set: QuestionSet): Promise<void> => {
    const { error } = await supabase
      .from('sets')
      .upsert(set);

    if (error) {
      console.error('Error saving set:', error);
      throw error;
    }
  },

  deleteSet: async (setId: string): Promise<void> => {
    const { error } = await supabase
      .from('sets')
      .delete()
      .eq('setId', setId);

    if (error) {
      console.error('Error deleting set:', error);
      throw error;
    }
  },
};