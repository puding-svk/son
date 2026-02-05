import React, { useState } from 'react';
import './SVGTestSection.css';

export const SVGTestSection: React.FC = () => {
  const [selectedColor, setSelectedColor] = useState('#1a1a1a');

  const colors = [
    { name: 'Black', value: '#1a1a1a' },
    { name: 'Red', value: '#d40000' },
    { name: 'Blue', value: '#0066cc' },
    { name: 'Green', value: '#00aa00' },
    { name: 'Orange', value: '#ff8800' },
    { name: 'Purple', value: '#8800cc' },
  ];

  return (
    <section className="svg-test-section">
      <div className="section-header">
        <h3>SVG Test Section</h3>
        <p>Test and preview SVG icons with different colors</p>
      </div>

      <div className="color-selector">
        <label htmlFor="color-picker">Select Color:</label>
        <div className="color-buttons">
          {colors.map((color) => (
            <button
              key={color.value}
              className={`color-btn ${selectedColor === color.value ? 'active' : ''}`}
              style={{ backgroundColor: color.value }}
              onClick={() => setSelectedColor(color.value)}
              title={color.name}
            />
          ))}
        </div>
        <input
          id="color-picker"
          type="color"
          value={selectedColor}
          onChange={(e) => setSelectedColor(e.target.value)}
          className="color-input"
        />
      </div>

      <div className="svg-gallery">
        {/* Car Icon */}
        <div className="svg-item">
          <div className="svg-preview" style={{ color: selectedColor }}>
            <svg 
              viewBox="0 0 47.032 47.032" 
              xmlns="http://www.w3.org/2000/svg"
              width="70" 
              height="70"
              style={{ color: selectedColor }}
            >
              <path fill="currentColor" d="M29.395,0H17.636c-3.117,0-5.643,3.467-5.643,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759
                c3.116,0,5.644-2.527,5.644-5.644V6.584C35.037,3.467,32.511,0,29.395,0z M34.05,14.188v11.665l-2.729,0.351v-4.806L34.05,14.188z
                 M32.618,10.773c-1.016,3.9-2.219,8.51-2.219,8.51H16.631l-2.222-8.51C14.41,10.773,23.293,7.755,32.618,10.773z M15.741,21.713
                v4.492l-2.73-0.349V14.502L15.741,21.713z M13.011,37.938V27.579l2.73,0.343v8.196L13.011,37.938z M14.568,40.882l2.218-3.336
                h13.771l2.219,3.336H14.568z M31.321,35.805v-7.872l2.729-0.355v10.048L31.321,35.805z"/>
            </svg>
          </div>
          <p className="svg-label">Car (Front View)</p>
        </div>

        {/* Motorcycle Icon */}
        <div className="svg-item">
          <div className="svg-preview" style={{ color: selectedColor }}>
            <svg
              width="80"
              height="160"
              viewBox="0 0 220 460"
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: selectedColor }}
            >
              <rect x="93.014" y="10" width="33.972" height="106.021" rx="22" fill="currentColor" />
              <ellipse cx="110" cy="108" rx="22" ry="10" style={{ stroke: 'currentColor', fill: 'rgb(255, 255, 255)', strokeWidth: '5px' }} />
              <path d="M20 140 Q110 95 200 140" stroke="currentColor" strokeWidth="10" fill="none" strokeLinecap="round" />
              <path d="M 70 206.215 C 96.667 159.819 123.333 159.819 150 206.215 C 160 260.345 146.667 302.875 110 333.806 C 73.333 302.875 60 260.345 70 206.215" style={{ stroke: 'currentColor', fill: 'rgb(255, 255, 255)', strokeWidth: '5px' }} transform="matrix(-1, 0, 0, -1, -0.000009, -0.000022)" />
              <rect x="103" y="125" width="14" height="55" rx="7" fill="currentColor" />
              <path d="M 70 148.554 C 96.667 112.663 123.333 112.663 150 148.554 C 160 190.427 146.667 223.327 110 247.254 C 73.333 223.327 60 190.427 70 148.554" style={{ stroke: 'currentColor', fill: 'rgb(255, 255, 255)', strokeWidth: '5px' }} />
              <rect x="97.409" y="235" width="26.15" height="55" rx="6" fill="currentColor" />
              <rect x="87.358" y="357.947" width="45.283" height="92.053" rx="22" fill="currentColor" />
              <path d="M110 320 Q80 350 90 385" stroke="currentColor" strokeWidth="8" fill="none" />
              <path d="M110 320 Q140 350 130 385" stroke="currentColor" strokeWidth="8" fill="none" />
              <ellipse cx="110" cy="311.303" rx="32" ry="74.223" style={{ fill: 'rgb(255, 255, 255)', stroke: 'currentColor', strokeWidth: '5px' }} />
            </svg>
          </div>
          <p className="svg-label">Motorcycle (Side View)</p>
        </div>

        {/* Truck Icon */}
        <div className="svg-item">
          <div className="svg-preview" style={{ color: selectedColor }}>
            <svg
              width="110"
              height="50"
              viewBox="0 0 220 100"
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: selectedColor }}
            >
              <path d="M 170.713 15.644 C 180.713 38.421 180.713 61.199 170.713 83.977" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              <rect x="142.173" y="24.183" width="41.827" height="52.137" rx="10" stroke="currentColor" strokeWidth="4" style={{ fill: 'rgb(255, 255, 255)' }} />
              <rect x="52.354" y="20" width="97.646" height="60" rx="2" stroke="currentColor" strokeWidth="4" style={{ fill: 'currentColor' }} />
              <path d="M150 25 Q165 50 150 75" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              
            </svg>
          </div>
          <p className="svg-label">Truck (Side View)</p>
        </div>
      </div>

      <div className="test-info">
        <p>Current Color: <code>{selectedColor}</code></p>
        <p>Use these icons in your drawing canvas by applying the selected color via CSS.</p>
      </div>
    </section>
  );
};

export default SVGTestSection;
