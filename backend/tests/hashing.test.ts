import bcrypt from 'bcrypt';

describe('Hashowanie haseł (bcrypt)', () => {

  it('hasło po hashowaniu wygląda zupełnie inaczej', async () => {
    const haslo = 'MojeHaslo123!';
    const hash = await bcrypt.hash(haslo, 10);

    console.log(' ORYGINALNE HASŁO:   ', haslo);
    console.log('HASH W BAZIE DANYCH:', hash);

    expect(hash).not.toBe(haslo);
    expect(hash.startsWith('$2b$')).toBe(true); 
  });

  it('dwa hashe tego samego hasła są RÓŻNE (salt)', async () => {
    const haslo = 'MojeHaslo123!';
    const hash1 = await bcrypt.hash(haslo, 10);
    const hash2 = await bcrypt.hash(haslo, 10);

    console.log(' Hash 1:', hash1);
    console.log(' Hash 2:', hash2);
    console.log('  Są różne? ', hash1 !== hash2 ? 'TAK ✅' : 'NIE ❌');

    expect(hash1).not.toBe(hash2); 
  });

  it('poprawne hasło przechodzi weryfikację', async () => {
    const haslo = 'MojeHaslo123!';
    const hash = await bcrypt.hash(haslo, 10);

    const wynik = await bcrypt.compare(haslo, hash);

    console.log(' Weryfikacja poprawnego hasła:', wynik);

    expect(wynik).toBe(true);
  });

  it('złe hasło NIE przechodzi weryfikacji', async () => {
    const haslo = 'MojeHaslo123!';
    const zleHaslo = 'ZleHaslo999!';
    const hash = await bcrypt.hash(haslo, 10);

    const wynik = await bcrypt.compare(zleHaslo, hash);

    console.log(' Weryfikacja złego hasła:', wynik);

    expect(wynik).toBe(false);
  });

  it('atak słownikowy - hash nie ujawnia oryginalnego hasła', async () => {
    const haslo = 'MojeHaslo123!';
    const hash = await bcrypt.hash(haslo, 10);

    const popularne = ['password', '123456', 'qwerty', 'admin', 'letmein'];

    console.log(' Próba złamania hasza popularymi hasłami:');
    let znalezione = false;
    for (const proba of popularne) {
      const match = await bcrypt.compare(proba, hash);
      console.log(`   "${proba}" → ${match ? '✅ PASUJE!' : '❌ nie pasuje'}`);
      if (match) znalezione = true;
    }

    expect(znalezione).toBe(false); 
  });

  it('koszt hashowania (rounds=10) trwa chwilę - celowo wolne', async () => {
    const haslo = 'MojeHaslo123!';
    const start = Date.now();
    await bcrypt.hash(haslo, 10);
    const czas = Date.now() - start;

    console.log(`\  Czas hashowania (10 rund): ${czas}ms`);
    console.log('  Celowo wolne - utrudnia brute-force ataki!');

    expect(czas).toBeGreaterThanOrEqual(50); 
  });

});
