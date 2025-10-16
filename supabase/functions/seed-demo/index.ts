import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Check if demo user exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    let demoUser = existingUser?.users?.find(u => u.email === 'demo@xpacecontrol.com');

    // Create demo user if doesn't exist
    if (!demoUser) {
      const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: 'demo@xpacecontrol.com',
        password: 'demo123456',
        email_confirm: true,
        user_metadata: {
          full_name: 'Escola Demo',
          phone: '+5511999999999'
        }
      });

      if (userError) throw userError;
      demoUser = newUser.user;
    }

    // Check if demo school exists
    const { data: existingSchool } = await supabaseAdmin
      .from('schools')
      .select('id')
      .eq('admin_id', demoUser!.id)
      .single();

    let schoolId = existingSchool?.id;

    // Create demo school if doesn't exist
    if (!schoolId) {
      const { data: school, error: schoolError } = await supabaseAdmin
        .from('schools')
        .insert({
          admin_id: demoUser!.id,
          name: 'Academia de Dança Demo',
          contact_email: 'demo@xpacecontrol.com',
          contact_phone: '+5511999999999',
          city: 'São Paulo'
        })
        .select()
        .single();

      if (schoolError) throw schoolError;
      schoolId = school.id;

      // Create trial subscription
      const { data: plan } = await supabaseAdmin
        .from('plans')
        .select('id')
        .eq('name', 'Start')
        .single();

      if (plan) {
        await supabaseAdmin.from('subscriptions').insert({
          school_id: schoolId,
          plan_id: plan.id,
          status: 'trial',
          renew_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    }

    // Clear existing demo data
    await supabaseAdmin.from('attendances').delete().eq('class_id', (await supabaseAdmin.from('classes').select('id').eq('school_id', schoolId)).data?.map(c => c.id) || []);
    await supabaseAdmin.from('payments').delete().eq('student_id', (await supabaseAdmin.from('students').select('id').eq('school_id', schoolId)).data?.map(s => s.id) || []);
    await supabaseAdmin.from('class_students').delete().eq('school_id', schoolId);
    await supabaseAdmin.from('classes').delete().eq('school_id', schoolId);
    await supabaseAdmin.from('students').delete().eq('school_id', schoolId);

    // Create 10 students
    const students = [];
    const studentNames = [
      'Ana Silva', 'Bruno Costa', 'Carla Santos', 'Daniel Oliveira', 'Elena Ferreira',
      'Felipe Lima', 'Gabriela Alves', 'Henrique Souza', 'Isabela Rocha', 'João Martins'
    ];

    for (let i = 0; i < 10; i++) {
      const { data: student, error } = await supabaseAdmin
        .from('students')
        .insert({
          school_id: schoolId,
          full_name: studentNames[i],
          email: `aluno${i + 1}@demo.com`,
          phone: `+551199${String(i).padStart(7, '0')}`,
          birth_date: new Date(2010 + i, i % 12, 1).toISOString().split('T')[0],
          active: true
        })
        .select()
        .single();

      if (!error && student) students.push(student);
    }

    // Create 3 classes
    const classNames = ['Ballet Iniciante', 'Jazz Intermediário', 'Hip Hop Avançado'];
    const classes = [];

    for (let i = 0; i < 3; i++) {
      const { data: classData, error } = await supabaseAdmin
        .from('classes')
        .insert({
          school_id: schoolId,
          name: classNames[i],
          description: `Turma de ${classNames[i]} - Modo Demo`,
          schedule_day: ['Segunda/Quarta', 'Terça/Quinta', 'Sexta'][i],
          schedule_time: ['18:00', '19:00', '20:00'][i],
          duration_minutes: 60,
          max_students: 15,
          active: true
        })
        .select()
        .single();

      if (!error && classData) classes.push(classData);
    }

    // Enroll students in classes (random distribution)
    for (const student of students) {
      const classIndex = Math.floor(Math.random() * classes.length);
      await supabaseAdmin.from('class_students').insert({
        school_id: schoolId,
        class_id: classes[classIndex].id,
        student_id: student.id
      });
    }

    // Create 20 attendances (last 30 days)
    for (let i = 0; i < 20; i++) {
      const student = students[Math.floor(Math.random() * students.length)];
      const classData = classes[Math.floor(Math.random() * classes.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      
      await supabaseAdmin.from('attendances').insert({
        student_id: student.id,
        class_id: classData.id,
        attendance_date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        marked_by: demoUser!.id
      });
    }

    // Create 5 payments (3 paid, 2 pending)
    for (let i = 0; i < 5; i++) {
      const student = students[i];
      const isPaid = i < 3;
      
      await supabaseAdmin.from('payments').insert({
        student_id: student.id,
        amount: 150.00,
        due_date: new Date(2025, 9, 10).toISOString().split('T')[0],
        reference_month: new Date(2025, 9, 1).toISOString().split('T')[0],
        status: isPaid ? 'paid' : 'pending',
        paid_date: isPaid ? new Date(2025, 9, 8).toISOString().split('T')[0] : null,
        payment_method: isPaid ? 'pix' : null
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Demo data seeded successfully',
        schoolId,
        email: 'demo@xpacecontrol.com',
        password: 'demo123456'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Seed error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
