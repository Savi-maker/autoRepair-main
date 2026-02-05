import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./data/mydb.sqlite3');

db.all("SELECT id, imie, nazwisko, mail, rola, customer_id FROM users WHERE rola IN ('klient', 'mechanik') LIMIT 8", (err, rows) => {
  console.log('=== TEST USERS ===');
  console.table(rows);
  
  db.all("SELECT id, customer_id, created_by_user_id, order_id, title FROM message_threads LIMIT 5", (err2, threads) => {
    console.log('\n=== MESSAGE THREADS ===');
    console.table(threads);
    
    db.all("SELECT id, thread_id, sender_user_id, sender_customer_id, text FROM messages LIMIT 3", (err3, msgs) => {
      console.log('\n=== MESSAGES ===');
      console.table(msgs);
      
      db.close();
      process.exit(0);
    });
  });
});
