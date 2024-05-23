// transform.ts
export const TransformBookCreateResponse = (data: any): any => {
    // Logika transformasi respons untuk buku
    return data.map(book => ({
      code: book.code,
      title: book.title,
      stock: book.stock
      // ...
    }));
  };
  
  export const transformAuthResponse = (data: any): any => {
    // Logika transformasi respons untuk autentikasi
    return {
      token: data.token,
      user: data.user,
      // ...
    };
  };
  