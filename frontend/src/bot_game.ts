/**
 * 4-Player Table Game Match Controller vs 3 AI Bots (TVB 2026 Rules)
 */

import { sound } from './audio';

export class BotGameManager {
  private gameId: string | null = null;
  private isProcessing: boolean = false;
  private isHudVisible: boolean = true;
  private autoStepTimer: any = null;

  constructor() {
    this.initEventListeners();
  }

  private initEventListeners() {
    // Restart match button
    document.getElementById('btn-restart-bot-game')?.addEventListener('click', () => {
      this.startMatch();
    });

    // Toggle HUD button
    document.getElementById('btn-toggle-bot-hud')?.addEventListener('click', () => {
      this.isHudVisible = !this.isHudVisible;
      const hudEl = document.getElementById('bot-efficiency-hud-panel');
      const textEl = document.getElementById('hud-toggle-text');
      if (hudEl) hudEl.style.display = this.isHudVisible ? 'block' : 'none';
      if (textEl) {
        textEl.textContent = this.isHudVisible ? 'ON' : 'OFF';
        textEl.style.color = this.isHudVisible ? '#60a5fa' : '#9ca3af';
      }
    });

    // Next Hand modal button
    document.getElementById('btn-modal-next-hand')?.addEventListener('click', () => {
      const modal = document.getElementById('bot-round-end-modal');
      if (modal) modal.style.display = 'none';
      this.startNextHand();
    });

    // Claim buttons
    document.getElementById('btn-claim-win')?.addEventListener('click', () => {
      this.sendClaimAction('WIN');
    });
    document.getElementById('btn-claim-pong')?.addEventListener('click', () => {
      this.sendClaimAction('PONG');
    });
    document.getElementById('btn-claim-kong')?.addEventListener('click', () => {
      this.sendClaimAction('KONG');
    });
    document.getElementById('btn-claim-pass')?.addEventListener('click', () => {
      this.sendClaimAction('PASS');
    });
  }

  public async startMatch() {
    if (this.autoStepTimer) clearTimeout(this.autoStepTimer);
    try {
      const res = await fetch('/api/bot-game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      this.gameId = data.game_id;
      this.renderState(data);
      sound.playTileClick();

      // If dealer is Bot 0, kick off automatic stepping
      if (data.current_turn_index !== 1) {
        this.scheduleAutoStep();
      }
    } catch (err: any) {
      alert(`Error starting match: ${err.message}`);
    }
  }

  public async startNextHand() {
    if (!this.gameId) return;
    try {
      const res = await fetch('/api/bot-game/next-hand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: this.gameId })
      });
      const data = await res.json();
      this.renderState(data);
      sound.playTileClick();

      if (data.current_turn_index !== 1) {
        this.scheduleAutoStep();
      }
    } catch (err: any) {
      alert(`Error starting next hand: ${err.message}`);
    }
  }

  public async discardUserTile(tile: string) {
    if (!this.gameId || this.isProcessing) return;
    this.isProcessing = true;

    try {
      const res = await fetch('/api/bot-game/user-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: this.gameId,
          action_type: 'DISCARD',
          tile: tile
        })
      });
      const data = await res.json();
      this.isProcessing = false;
      this.renderState(data);
      sound.playTileClick();

      if (data.current_turn_index !== 1 && !data.is_round_over) {
        this.scheduleAutoStep();
      }
    } catch (err: any) {
      this.isProcessing = false;
      alert(`Discard failed: ${err.message}`);
    }
  }

  public async sendClaimAction(actionType: 'WIN' | 'PONG' | 'KONG' | 'CHOW' | 'PASS', meldData?: any) {
    if (!this.gameId || this.isProcessing) return;
    this.isProcessing = true;

    try {
      const res = await fetch('/api/bot-game/user-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: this.gameId,
          action_type: actionType,
          meld_data: meldData
        })
      });
      const data = await res.json();
      this.isProcessing = false;
      this.renderState(data);

      if (actionType === 'WIN') {
        sound.playVictory();
      } else {
        sound.playTileClick();
      }

      if (data.current_turn_index !== 1 && !data.is_round_over) {
        this.scheduleAutoStep();
      }
    } catch (err: any) {
      this.isProcessing = false;
      alert(`Claim action error: ${err.message}`);
    }
  }

  private scheduleAutoStep() {
    if (this.autoStepTimer) clearTimeout(this.autoStepTimer);
    this.autoStepTimer = setTimeout(async () => {
      if (!this.gameId) return;
      try {
        const res = await fetch('/api/bot-game/step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ game_id: this.gameId })
        });
        const data = await res.json();
        this.renderState(data);
        sound.playTileClick();

        if (data.is_round_over) {
          // Logic for end round modal handled in renderState/external handler
          return;
        }

        if (data.current_turn_index !== 1 && !data.waiting_for_user_claim && !data.waiting_for_user_discard) {
          this.scheduleAutoStep();
        }
      } catch (err) {
        console.error('Error during auto-step:', err);
      }
    }, 700);
  }

  public renderState(state: any) {
    const isZh = true;

    // 1. Status Bar Header
    const roundBadge = document.getElementById('bot-game-round-badge');
    const wallCount = document.getElementById('bot-game-wall-count');
    const dealerBadge = document.getElementById('bot-game-dealer-badge');

    const windNames: { [k: string]: string } = isZh ? 
      { '1z': '東風圈', '2z': '南風圈', '3z': '西風圈', '4z': '北風圈' } :
      { '1z': 'East Round', '2z': 'South Round', '3z': 'West Round', '4z': 'North Round' };

    if (roundBadge) roundBadge.textContent = `🀄 ${windNames[state.prevailing_wind] || '東風圈'} • ${isZh ? '第' + (state.hand_number || 1) + '局' : 'Hand #' + (state.hand_number || 1)}/16`;
    if (wallCount) wallCount.textContent = `${state.remaining_wall_count ?? 0} ${isZh ? '張剩餘' : 'Tiles Left'}`;
    if (dealerBadge) dealerBadge.textContent = `${isZh ? '庄' : 'Dealer'}: ${state.players ? state.players[state.dealer_index]?.name : ''}`;

    const centerWind = document.getElementById('table-center-wind');
    const turnInd = document.getElementById('table-turn-indicator');
    if (centerWind) centerWind.textContent = windNames[state.prevailing_wind]?.split(' ')[0] || '東';
    if (turnInd) {
      const activeP = state.players ? state.players[state.current_turn_index] : null;
      turnInd.textContent = `${isZh ? '回合' : 'Turn'}: ${activeP?.name || 'Player'} (${state.current_turn_index === 1 ? (isZh ? '👉 輪到你' : '👉 Your Move') : (isZh ? '思考中...' : 'Thinking...')})`;
      turnInd.style.color = state.current_turn_index === 1 ? '#60a5fa' : '#9ca3af';
    }

    // 2. Render Player Badges & Active Glow
    [0, 1, 2, 3].forEach(idx => {
      const p = state.players[idx];
      const badge = document.getElementById(`badge-p${idx}`);
      const score = document.getElementById(`score-p${idx}`);
      const seat = document.getElementById(`seat-p${idx}`);

      if (badge) {
        if (state.current_turn_index === idx) {
          badge.classList.add('active-turn');
        } else {
          badge.classList.remove('active-turn');
        }
      }
      if (score) score.textContent = `${p.score} pts`;
      if (seat) {
        const windMap: { [k: string]: string } = isZh ? { '1z': '東', '2z': '南', '3z': '西', '4z': '北' } : { '1z': 'E', '2z': 'S', '3z': 'W', '4z': 'N' };
        const windChar = windMap[p.seat_wind] || (isZh ? '東' : 'E');
        seat.textContent = windChar;
        if (state.dealer_index === idx) {
          seat.classList.add('dealer');
        } else {
          seat.classList.remove('dealer');
        }
      }

      // Melds
      const meldsContainer = document.getElementById(`melds-p${idx}`);
      if (meldsContainer) {
        meldsContainer.innerHTML = p.melds.map((m: any) => {
          const isConcealed = m.type === 'concealed_kong';
          return `
            <div class="meld-group ${isConcealed ? 'concealed-kong-meld' : ''}" title="${m.type.toUpperCase()}">
              ${m.tiles.map((t: string, tIdx: number) => {
                const isHidden = isConcealed && (tIdx === 0 || tIdx === 3) && !state.game_over && idx !== 1;
                return `
                  <div class="meld-tile ${isHidden ? 'meld-tile-hidden' : ''}">
                    ${isHidden 
                      ? '<div class="bot-tile-back" style="width:100%; height:100%; border-radius:2px;"></div>' 
                      : `<img src="/tiles/${t}.png?v=4" alt="${t}" />`}
                  </div>
                `;
              }).join('')}
            </div>
          `;
        }).join('');
      }
    });

    // 3. Render Rivers (河)
    [0, 1, 2, 3].forEach(idx => {
      const riverBox = document.getElementById(`river-p${idx}`);
      if (riverBox) {
        const p = state.players[idx];
        riverBox.innerHTML = p.river.map((item: any, rIdx: number) => {
          const isLast = (state.last_discard?.player_index === idx && rIdx === p.river.length - 1);
          return `
            <div class="river-tile-chip ${isLast ? 'last-discard' : ''}" title="${item.tile}">
              <img src="/tiles/${item.tile}.png?v=4" alt="${item.tile}" />
            </div>
          `;
        }).join('');
      }
    });

    // 4. Render User Interactive Hand
    const userRack = document.getElementById('bot-user-tiles-rack');
    if (userRack) {
      const userTiles: string[] = state.players[1]?.hand_tiles || [];
      const isUserTurn = (state.current_turn_index === 1 && (userTiles.length % 3 === 2 || state.waiting_for_user_discard));

      userRack.innerHTML = userTiles.map((t, idx) => {
        const isDrawn = ((userTiles.length % 3 === 2) && state.current_turn_index === 1 && (state.drawn_tile ? (t === state.drawn_tile && idx === userTiles.lastIndexOf(t)) : idx === userTiles.length - 1));
        return `
          <div class="user-interactive-tile ${isDrawn ? 'drawn-tile' : ''}" data-tile="${t}" title="Click to discard ${t}">
            <span class="tile-name-label">${t}</span>
            <img src="/tiles/${t}.png?v=4" alt="${t}" />
            <span style="font-size:0.6rem; color:#6b7280;">${isDrawn ? (isZh ? '摸' : 'DRAW') : ''}</span>
          </div>
        `;
      }).join('');

      userRack.querySelectorAll('.user-interactive-tile').forEach(el => {
        el.addEventListener('click', (e) => {
          if (!isUserTurn) return;
          const target = e.currentTarget as HTMLElement;
          const tile = target.getAttribute('data-tile');
          if (tile) {
            this.discardUserTile(tile);
          }
        });
      });
    }

    // 5. Claim Action Bar
    const claimBar = document.getElementById('bot-claim-actions-bar');
    if (claimBar) {
      if (state.user_claim_prompt && state.waiting_for_user_claim) {
        claimBar.style.display = 'flex';
        const prompt = state.user_claim_prompt;

        const winBtn = document.getElementById('btn-claim-win');
        const pongBtn = document.getElementById('btn-claim-pong');
        const kongBtn = document.getElementById('btn-claim-kong');
        const chowBtn = document.getElementById('btn-claim-chow');

        if (winBtn) {
          winBtn.style.display = prompt.can_win ? 'flex' : 'none';
          const winTitle = isZh ? 
            (prompt.is_self_draw ? '🀄 自摸 (Self-Draw!)' : '🀄 食胡 (Ron Win!)') :
            (prompt.is_self_draw ? '🀄 Win (Self-Draw!)' : '🀄 Win (Ron!)');
          const fanLabel = isZh ? `${prompt.win_fan}番` : `${prompt.win_fan} Fan`;
          winBtn.innerHTML = `${winTitle} <span id="claim-win-fan-badge" class="badge" style="background:#fff; color:#b91c1c; font-size:0.75rem;">${fanLabel} (${prompt.hand_name})</span>`;
        }
        if (pongBtn) {
          pongBtn.style.display = prompt.can_pong ? 'flex' : 'none';
          pongBtn.textContent = isZh ? '碰 (Pong)' : 'Pong (Triplet)';
        }
        if (kongBtn) {
          kongBtn.style.display = prompt.can_kong ? 'flex' : 'none';
          if (prompt.can_kong) {
            const kOpt = prompt.kong_options && prompt.kong_options.length > 0 ? prompt.kong_options[0] : null;
            const kDesc = kOpt?.desc ? ` (${kOpt.desc})` : '';
            const kongTitle = isZh ? `槓 (Kong)${kDesc}` : `Kong${kDesc}`;
            kongBtn.innerHTML = `${kongTitle}`;
            kongBtn.onclick = () => {
              this.sendClaimAction('KONG', kOpt);
            };
          }
        }
        if (chowBtn) {
          chowBtn.style.display = prompt.can_chow ? 'flex' : 'none';
          chowBtn.textContent = isZh ? '上 (Chow)' : 'Chow (Sequence)';
          if (prompt.can_chow && prompt.chow_options?.length > 0) {
            chowBtn.onclick = () => {
              this.sendClaimAction('CHOW', prompt.chow_options[0]);
            };
          }
        }
      } else {
        claimBar.style.display = 'none';
      }
    }

    // 6. Live Efficiency HUD
    const hudShanten = document.getElementById('hud-shanten-badge');
    const hudOptText = document.getElementById('hud-optimal-discard-text');
    const hudOutsChips = document.getElementById('hud-live-outs-chips');

    if (state.user_efficiency_hud) {
      const hud = state.user_efficiency_hud;
      if (hudShanten) {
        const sVal = hud.best_shanten !== undefined ? hud.best_shanten : (hud.shanten !== undefined ? hud.shanten : 0);
        if (sVal === -1) {
          hudShanten.textContent = isZh ? '🎉 胡牌 (Complete Hand!)' : '🎉 Complete Winning Hand!';
          hudShanten.className = 'shanten-badge shanten-0';
        } else if (sVal === 0) {
          hudShanten.textContent = isZh ? '🎯 聽牌 (Tenpai)' : '🎯 Tenpai (0-Shanten)';
          hudShanten.className = 'shanten-badge shanten-0';
        } else {
          hudShanten.textContent = isZh ? `${sVal}向聽` : `${sVal}-Shanten`;
          hudShanten.className = `shanten-badge shanten-${Math.min(2, Math.max(0, sVal))}`;
        }
      }
      if (hudOptText) {
        if (hud.optimal_discard) {
          hudOptText.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
              <img src="/tiles/${hud.optimal_discard}.png?v=4" style="width:24px; height:32px; object-fit:contain; background:#fff; border-radius:2px;" />
              <span>${isZh ? '建議捨牌' : 'Discard'} <strong>${hud.optimal_discard}</strong> (${hud.max_outs} ${isZh ? '張剩餘進張' : 'live outs in wall'})</span>
            </div>
          `;
        } else {
          const sVal = hud.best_shanten !== undefined ? hud.best_shanten : (hud.shanten !== undefined ? hud.shanten : 0);
          if (sVal === -1) {
            hudOptText.textContent = isZh ? '🎉 手牌已成胡！' : '🎉 Hand is complete! Declare Win.';
          } else if (sVal === 0) {
            hudOptText.textContent = isZh ? '🎯 已進入聽牌狀態！等待自摸或食胡。' : '🎯 Hand in Tenpai! Waiting on winning tiles.';
          } else {
            hudOptText.textContent = isZh ? '⏳ 等待摸牌以計算最佳進張捨牌...' : '⏳ Waiting for your draw to recommend discard...';
          }
        }
      }
      if (hudOutsChips && hud.accepted_tiles) {
        hudOutsChips.innerHTML = hud.accepted_tiles.map((t: any) => `
          <span class="chip-tile" style="font-size:0.75rem; padding:2px 6px;">
            <img src="/tiles/${t.tile}.png?v=4" style="width:14px; height:18px; object-fit:contain;" />
            ${t.tile} <strong style="color:var(--accent-gold);">(${t.count})</strong>
          </span>
        `).join('');
      }
    }

    // 7. Match Logs Ticker
    const logBox = document.getElementById('bot-match-log-ticker');
    if (logBox && state.match_logs) {
      logBox.innerHTML = state.match_logs.map((l: string) => `<div>${l}</div>`).join('');
      logBox.scrollTop = logBox.scrollHeight;
    }

    // 8. Round End / Victory Modal
    const endModal = document.getElementById('bot-round-end-modal');
    if (endModal && state.game_over && state.winner_info) {
      endModal.style.display = 'flex';
      const w = state.winner_info;

      const iconEl = document.getElementById('modal-winner-icon');
      const titleEl = document.getElementById('modal-winner-title');
      const handNameEl = document.getElementById('modal-hand-name');
      const rackEl = document.getElementById('modal-winning-hand-rack');
      const breakdownEl = document.getElementById('modal-fan-breakdown-box');
      const pointsEl = document.getElementById('modal-points-delta-table');

      if (w.is_exhaust_draw) {
        if (iconEl) iconEl.textContent = '🤝';
        if (titleEl) titleEl.textContent = '摸和流局 (Exhaust Draw)';
        if (handNameEl) handNameEl.textContent = 'Wall Depleted - Dealer Passes (過莊)';
        if (rackEl) rackEl.innerHTML = '';
        if (breakdownEl) breakdownEl.innerHTML = 'Zero points exchanged. Proceeding to next round.';
        if (pointsEl) pointsEl.innerHTML = '';
      } else {
        const isUserWinner = (w.winner_index === 1);
        if (iconEl) iconEl.textContent = isUserWinner ? '🏆🎉' : '💥';
        if (titleEl) titleEl.textContent = `${w.winner_name} ${w.is_self_draw ? '自摸胡牌 (Self-Draw)!' : '出銃胡牌 (Ron Win)!'}`;
        if (handNameEl) handNameEl.textContent = `${w.hand_name} (${w.fan} 番 / Fan)`;

        if (rackEl && w.winning_hand) {
          rackEl.innerHTML = w.winning_hand.map((t: string) => `
            <img src="/tiles/${t}.png?v=4" alt="${t}" style="width:26px; height:36px; object-fit:contain; background:#fff; border-radius:3px;" />
          `).join('');
        }

        if (breakdownEl && w.breakdown) {
          breakdownEl.innerHTML = `
            <ul style="list-style:none; padding:0;">
              ${w.breakdown.map((b: any) => `
                <li style="display:flex; justify-content:space-between; padding:2px 0;">
                  <span>${b.name} (${b.jyutping})</span>
                  <strong style="color:var(--accent-gold);">+${b.fan} 番</strong>
                </li>
              `).join('')}
            </ul>
          `;
        }

        if (pointsEl && w.point_delta) {
          pointsEl.innerHTML = state.players.map((p: any, pIdx: number) => {
            const delta = w.point_delta[pIdx];
            const color = delta > 0 ? 'var(--accent-emerald)' : (delta < 0 ? '#ef4444' : '#9ca3af');
            return `
              <div style="background:rgba(0,0,0,0.3); padding:6px; border-radius:6px;">
                <div style="font-size:0.75rem; color:#9ca3af;">${p.name}</div>
                <div style="color:${color}; font-size:1.1rem;">${delta > 0 ? `+${delta}` : delta} pts</div>
              </div>
            `;
          }).join('');
        }

        if (isUserWinner) {
          sound.playSuccess();
        } else {
          sound.playWarning();
        }
      }
    }
  }
}
