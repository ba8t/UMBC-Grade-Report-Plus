// ==UserScript==
// @name         UMBC Grade Report+
// @namespace    https://github.com/ba8t
// @version      0.1
// @description  Enhances the UMBC Grade Report page with additional features.
// @author       ba8t
// @match        *://my3.my.umbc.edu/apps/bb/activity/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const container = document.getElementById('cma_grade_main');
    if (!container) return;

    const table = container.querySelector('.html-content table');
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr');
    const gradeData = [];
    let userGrade = null;

    rows.forEach(row => {
        // Skip header and totals rows
        if (row.classList.contains('first') || row.classList.contains('totals') || row.querySelector('th')) {
            return;
        }

        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
            const grade = parseFloat(cells[0].textContent.trim());
            const count = parseInt(cells[1].textContent.trim(), 10);

            if (!isNaN(grade) && !isNaN(count) && count > 0) {
                gradeData.push({ grade, count });

                if (row.classList.contains('user')) {
                    userGrade = grade;
                }
            }
        }
    });

    if (gradeData.length === 0) return;

    // Sort numerically by grade ascending (fixes the table's alphabetical sorting)
    gradeData.sort((a, b) => a.grade - b.grade);

    // Expand grades into a flat list of individual scores and find the mode
    const allScores = [];
    let sum = 0;
    let maxUsers = 0;
    let modes = [];

    gradeData.forEach(({ grade, count }) => {
        sum += grade * count;
        for (let i = 0; i < count; i++) {
            allScores.push(grade);
        }

        if (count > maxUsers) {
            maxUsers = count;
            modes = [grade];
        } else if (count === maxUsers) {
            modes.push(grade);
        }
    });

    const totalUsers = allScores.length;
    const mean = (sum / totalUsers).toFixed(2);
    const lowest = allScores[0];
    const highest = allScores[totalUsers - 1];

    // Calculate Median
    let median;
    const mid = Math.floor(totalUsers / 2);
    if (totalUsers % 2 === 0) {
        median = (allScores[mid - 1] + allScores[mid]) / 2;
    } else {
        median = allScores[mid];
    }

    // Calculate User Rank (1 = highest score)
    let rankText = 'N/A (No user grade highlighted)';
    if (userGrade !== null) {
        const higherCount = allScores.filter(score => score > userGrade).length;
        const tiedCount = allScores.filter(score => score === userGrade).length;
        const rank = higherCount + 1;

        if (tiedCount > 1) {
            rankText = `${rank} out of ${totalUsers} (tied with ${tiedCount - 1} other${tiedCount - 1 === 1 ? '' : 's'}, ranks ${rank}–${higherCount + tiedCount})`;
        } else {
            rankText = `${rank} out of ${totalUsers}`;
        }
    }

    // Create and insert the summary element below the table
    const summaryLine = document.createElement('p');
    summaryLine.style.marginTop = '12px';
    summaryLine.style.padding = '10px';
    summaryLine.style.backgroundColor = '#f4f6f8';
    summaryLine.style.border = '1px solid #dcdcdc';
    summaryLine.style.borderRadius = '4px';
    summaryLine.style.fontFamily = 'sans-serif';
    summaryLine.style.fontSize = '14px';
    summaryLine.style.display = 'flex';
    summaryLine.style.flexWrap = 'wrap';
    summaryLine.style.gap = '10px 16px';

    summaryLine.innerHTML = `
        <span><strong>Mean:</strong> ${mean}</span>
        <span><strong>Median:</strong> ${median}</span>
        <span><strong>Mode:</strong> ${modes.join(', ')} (${maxUsers} users)</span>
        <span><strong>Lowest:</strong> ${lowest}</span>
        <span><strong>Highest:</strong> ${highest}</span>
        <span><strong>Your Rank:</strong> 
            <span style="color: #b30000; font-weight: bold;">${rankText}</span>
        </span>
    `;

    table.parentElement.appendChild(summaryLine);
})();