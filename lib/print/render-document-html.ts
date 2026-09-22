import type { PrescriptionPrintData, MedcertPrintData, PrintDoctor } from '@/lib/documents/get-print-data'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
}

function renderLetterhead(doctor: PrintDoctor): string {
  const clinic = doctor.clinicLocations[0]
  return `
    <div class="letterhead">
      <p class="name">${escapeHtml(doctor.printedName)}</p>
      ${doctor.credentials ? `<p class="credentials">${escapeHtml(doctor.credentials)}</p>` : ''}
      ${
        clinic
          ? `<p class="clinic">${escapeHtml(clinic.name)}${clinic.address ? ' — ' + escapeHtml(clinic.address) : ''}${clinic.contactNumber ? ' — ' + escapeHtml(clinic.contactNumber) : ''}</p>`
          : ''
      }
      <p class="license">License No. ${escapeHtml(doctor.licenseNumber)}${doctor.ptrNumber ? ` &nbsp;·&nbsp; PTR No. ${escapeHtml(doctor.ptrNumber)}` : ''}</p>
    </div>
  `
}

function renderSignatureBlock(doctor: PrintDoctor, signatureDataUri: string | null): string {
  return `
    <div class="signature-block">
      ${signatureDataUri ? `<img src="${signatureDataUri}" alt="Signature" />` : ''}
      <div>
        <span class="signed-name">${escapeHtml(doctor.printedName)}</span>
      </div>
      <p class="signed-license">License No. ${escapeHtml(doctor.licenseNumber)}</p>
    </div>
  `
}

export function renderPrescriptionBodyHtml(data: PrescriptionPrintData): string {
  return `
    <div class="document">
      ${data.status === 'voided' ? '<div class="voided-stamp">VOIDED</div>' : ''}
      ${renderLetterhead(data.doctor)}
      <div class="patient-info">
        <div>
          <p class="label">Patient</p>
          <p>${escapeHtml(data.patient.fullName)}${data.patient.age != null ? `, ${data.patient.age}` : ''}${data.patient.sex ? ` / ${escapeHtml(data.patient.sex)}` : ''}</p>
        </div>
        <div>
          <p class="label">Date</p>
          <p>${formatDate(data.createdAt)}</p>
        </div>
      </div>
      <p class="rx-symbol">℞</p>
      <div class="content-body">${escapeHtml(data.prescriptionDetails)}</div>
      ${renderSignatureBlock(data.doctor, data.signatureDataUri)}
    </div>
  `
}

export function renderMedcertBodyHtml(data: MedcertPrintData): string {
  return `
    <div class="document">
      ${data.status === 'voided' ? '<div class="voided-stamp">VOIDED</div>' : ''}
      ${renderLetterhead(data.doctor)}
      <div class="patient-info">
        <div>
          <p class="label">Patient</p>
          <p>${escapeHtml(data.patient.fullName)}${data.patient.age != null ? `, ${data.patient.age}` : ''}${data.patient.sex ? ` / ${escapeHtml(data.patient.sex)}` : ''}</p>
        </div>
        <div>
          <p class="label">Date</p>
          <p>${formatDate(data.createdAt)}</p>
        </div>
      </div>
      <p class="content-label">Medical Certificate</p>
      <div class="content-body">${escapeHtml(data.certificationDescription)}</div>
      ${data.diagnosisDetails ? `<div class="field-row"><span class="label">Diagnosis</span><span>${escapeHtml(data.diagnosisDetails)}</span></div>` : ''}
      ${
        data.inclusiveStartDate || data.inclusiveDatesNote
          ? `<div class="field-row"><span class="label">Inclusive dates</span><span>${
              data.inclusiveStartDate
                ? `${formatDate(data.inclusiveStartDate)}${data.inclusiveEndDate ? ` to ${formatDate(data.inclusiveEndDate)}` : ''}`
                : ''
            }${data.inclusiveDatesNote ? ` (${escapeHtml(data.inclusiveDatesNote)})` : ''}</span></div>`
          : ''
      }
      ${
        data.fitToWork != null
          ? `<div class="field-row"><span class="label">Fit to work</span><span>${data.fitToWork ? 'Yes' : 'No'}${data.fitToWorkNote ? ` — ${escapeHtml(data.fitToWorkNote)}` : ''}</span></div>`
          : ''
      }
      ${data.remarks ? `<div class="field-row"><span class="label">Remarks</span><span>${escapeHtml(data.remarks)}</span></div>` : ''}
      ${renderSignatureBlock(data.doctor, data.signatureDataUri)}
    </div>
  `
}

export function wrapDocumentHtml(bodyHtml: string, styles: string): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>${styles}</style>
</head>
<body>${bodyHtml}</body>
</html>`
}
