import { useState } from 'react';

const CourseGenerator = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [customCourseName, setCustomCourseName] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const calculateFileHash = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleGenerate = async () => {
    if (!file) {
      alert("Vui lòng chọn một file giáo trình!");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setSaveStatus(null);

    try {
      // 1. Calculate File Hash
      const fileHash = await calculateFileHash(file);
      
      // 2. Check if Hash exists in Database
      const checkRes = await fetch(`http://localhost:8080/api/courses/check-hash/${fileHash}`);
      if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.exists) {
              alert("❌ Giáo trình này đã tồn tại trên hệ thống! Vui lòng không upload lại file y hệt.");
              setLoading(false);
              return;
          }
      }

      // 3. Gửi cho AI
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/generate-course', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Lỗi khi gọi AI Server');
      }

      const data = await response.json();
      data.file_hash = fileHash; // Gắn thêm hash để lưu xuống Java
      setResult(data);
      setCustomCourseName(data.course_name || "Khóa học mới");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCourse = async () => {
    if (!customCourseName.trim()) {
      alert("Vui lòng nhập tên khóa học!");
      return;
    }
    setSaveStatus('saving');
    try {
      const finalResult = { ...result, course_name: customCourseName };
      const response = await fetch('http://localhost:8080/api/courses/save-generated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalResult),
      });

      if (!response.ok) {
        throw new Error('Lỗi khi lưu vào Database');
      }

      setSaveStatus('success');
      alert('Đã lưu khóa học thành công vào CSDL!');
    } catch (err) {
      setSaveStatus('error');
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>
        🤖 AI: Tự động phân tích Giáo Trình
      </h1>
      
      <div style={{ margin: '20px 0', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
        <input 
          type="file" 
          accept=".txt,.pdf,.doc,.docx" 
          onChange={handleFileChange} 
          style={{ marginBottom: '15px', display: 'block' }}
        />
        <button 
          onClick={handleGenerate} 
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#95a5a6' : '#2ecc71',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {loading ? '⏳ AI Đang Xử Lý (Vui lòng chờ)...' : '🚀 Bắt Đầu Tạo Khóa Học'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '15px', backgroundColor: '#ff7675', color: 'white', borderRadius: '5px' }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #bdc3c7', paddingBottom: '15px' }}>
            <div style={{ flex: 1, marginRight: '20px' }}>
              <h2 style={{ color: '#27ae60', margin: '0 0 10px 0', fontSize: '18px' }}>🎉 Tạo Thành Công! Đặt tên khóa học:</h2>
              <input 
                type="text" 
                value={customCourseName}
                onChange={(e) => setCustomCourseName(e.target.value)}
                placeholder="Nhập tên khóa học..."
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  border: '2px solid #3498db',
                  borderRadius: '5px',
                  color: '#2c3e50',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button
              onClick={handleSaveCourse}
              disabled={saveStatus === 'saving' || saveStatus === 'success'}
              style={{
                padding: '10px 20px',
                backgroundColor: saveStatus === 'success' ? '#27ae60' : '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: (saveStatus === 'saving' || saveStatus === 'success') ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '15px'
              }}
            >
              {saveStatus === 'saving' ? '⏳ Đang lưu...' : (saveStatus === 'success' ? '✅ Đã Lưu Khóa Học' : '💾 Lưu Khóa Học Vào CSDL')}
            </button>
          </div>
          
          {result.chapters?.map((chapter, index) => (
            <div key={index} style={{ margin: '20px 0', padding: '15px', border: '1px solid #bdc3c7', borderRadius: '8px' }}>
              <h3 style={{ color: '#2980b9', marginTop: 0 }}>{chapter.chapter_title}</h3>
              
              {chapter.sections?.map((section, sIndex) => (
                <div key={sIndex} style={{ marginLeft: '20px', padding: '10px', backgroundColor: '#ecf0f1', borderRadius: '5px', marginBottom: '10px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#34495e' }}>{section.section_title}</h4>
                  <p style={{ margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {section.content.replace(/(\*\*|##|#)/g, '')}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseGenerator;
