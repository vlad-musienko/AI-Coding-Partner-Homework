/**
 * XML Import Tests
 * Tests for XML file parsing
 */

import {parseXML} from '../src/parsers/xmlParser';
import * as fs from 'fs';
import * as path from 'path';

describe('XML Import', () => {
    it('should parse valid XML file', () => {
        const xmlContent = fs.readFileSync(
            path.join(__dirname, 'fixtures/sample_tickets.xml'),
            'utf-8'
        );

        const result = parseXML(xmlContent);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].data.customer_email).toBeDefined();
    });

    it('should handle single ticket in XML', () => {
        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<tickets>
  <ticket>
    <customer_id>CUST001</customer_id>
    <customer_email>test@example.com</customer_email>
    <customer_name>Test User</customer_name>
    <subject>Test Subject</subject>
    <description>Test description</description>
    <metadata>
      <source>web_form</source>
    </metadata>
  </ticket>
</tickets>`;

        const result = parseXML(xmlContent);
        expect(result.length).toBe(1);
        expect(result[0].data.customer_id).toBe('CUST001');
    });

    it('should reject XML without root tickets element', () => {
        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<ticket>
  <customer_id>CUST001</customer_id>
</ticket>`;

        expect(() => parseXML(xmlContent)).toThrow();
    });

    it('should parse tags correctly', () => {
        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<tickets>
  <ticket>
    <customer_id>CUST001</customer_id>
    <customer_email>test@example.com</customer_email>
    <customer_name>Test User</customer_name>
    <subject>Test</subject>
    <description>Test description</description>
    <tags>
      <tag>tag1</tag>
      <tag>tag2</tag>
    </tags>
    <metadata>
      <source>web_form</source>
    </metadata>
  </ticket>
</tickets>`;

        const result = parseXML(xmlContent);
        expect(result[0].data.tags).toEqual(['tag1', 'tag2']);
    });
});
