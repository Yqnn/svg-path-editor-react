import { useCallback, useMemo, useState, type AnimationEvent } from 'react';
import Fab from '@mui/material/Fab';
import Icon from '@mui/material/Icon';
import { useStore } from '../editor/EditorProvider';
import { Expandable } from './Expandable';
import { NumberInput } from './NumberInput';
import { CheckboxField } from './CheckboxField';
import { AppTooltip } from './AppTooltip';
import { FlatButton, RaisedButton } from './buttons';
import { CommandRow } from './CommandRow';
import { CreateCommandMenu } from './CommandMenus';
import { getItemKey } from '../editor/item-key';
import { Open } from './Open';
import { Save } from './Save';

type NumberField =
  | 'scaleX'
  | 'scaleY'
  | 'translateX'
  | 'translateY'
  | 'rotateX'
  | 'rotateY'
  | 'rotateAngle'
  | 'roundValuesDecimals';

interface LeftPanelProps {
  closing: boolean;
  entering: boolean;
  onClosed: () => void;
  onEntered: () => void;
  onCloseClick: () => void;
}

export function LeftPanel({
  closing,
  entering,
  onClosed,
  onEntered,
  onCloseClick,
}: LeftPanelProps) {
  const store = useStore();
  const { cfg } = store;
  const [addAnchor, setAddAnchor] = useState<HTMLElement | null>(null);

  const setNumber = useCallback(
    (key: NumberField, value: number) => {
      store.setNumberField(key, value);
    },
    [store],
  );

  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    store.refreshCanvasSize();
    if (closing) {
      onClosed();
    } else if (entering) {
      onEntered();
    }
  };

  const configurationPanel = useMemo(
    () => (
      <Expandable panelTitle="Configuration" opened>
        <div className="row">
          {(
            [
              { id: 'viewbox-x', label: 'X', value: cfg.viewPortX, type: 'float' as const },
              { id: 'viewbox-y', label: 'Y', value: cfg.viewPortY, type: 'float' as const },
              {
                id: 'viewbox-width',
                label: 'Width',
                value: cfg.viewPortWidth,
                type: 'positive-float' as const,
              },
              {
                id: 'viewbox-height',
                label: 'Height',
                value: cfg.viewPortHeight,
                type: 'positive-float' as const,
              },
            ] as const
          ).map(({ id, label, value, type }) => (
            <div
              key={id}
              className={`input-block${cfg.viewPortLocked ? ' disabled' : ''}`}
              style={{ flex: '1 1 0', minWidth: 0 }}
            >
              <label htmlFor={id}>{label}</label>
              <NumberInput
                id={id}
                value={value}
                formatterType={type}
                disabled={cfg.viewPortLocked}
                className="app-input"
                onChange={(newValue) => {
                  if (id === 'viewbox-x') {
                    store.updateViewPort(
                      newValue,
                      cfg.viewPortY,
                      cfg.viewPortWidth,
                      cfg.viewPortHeight,
                    );
                  } else if (id === 'viewbox-y') {
                    store.updateViewPort(
                      cfg.viewPortX,
                      newValue,
                      cfg.viewPortWidth,
                      cfg.viewPortHeight,
                    );
                  } else if (id === 'viewbox-width') {
                    store.updateViewPort(cfg.viewPortX, cfg.viewPortY, newValue, null);
                  } else {
                    store.updateViewPort(cfg.viewPortX, cfg.viewPortY, null, newValue);
                  }
                }}
              />
            </div>
          ))}
          <AppTooltip
            title={cfg.viewPortLocked ? 'Unlock viewBox' : 'Lock viewBox'}
            placement="right"
          >
            <FlatButton
              className="icon-flat-button"
              onClick={() => store.updateCfg({ viewPortLocked: !cfg.viewPortLocked })}
            >
              <Icon>{cfg.viewPortLocked ? 'lock' : 'lock_open'}</Icon>
            </FlatButton>
          </AppTooltip>
        </div>
        <div className="row">
          <CheckboxField
            style={{ flex: 1 }}
            checked={cfg.snapToGrid}
            onChange={(checked) => store.updateCfg({ snapToGrid: checked })}
          >
            Snap to Grid
          </CheckboxField>
          <AppTooltip
            title="Number of decimals to keep when a point is dragged"
            placement="right"
            disabled={cfg.snapToGrid}
          >
            <div
              className={`input-block${cfg.snapToGrid ? ' disabled' : ''}`}
              style={{ flex: 1, minWidth: 0 }}
            >
              <label htmlFor="point-precision">Point Precision</label>
              <NumberInput
                id="point-precision"
                className="app-input"
                formatterType="positive-integer"
                value={cfg.decimalPrecision}
                disabled={cfg.snapToGrid}
                onChange={(newValue) => store.updateCfg({ decimalPrecision: newValue })}
              />
            </div>
          </AppTooltip>
        </div>
        <div className="row">
          <CheckboxField
            style={{ flex: 1 }}
            checked={cfg.filled}
            onChange={(checked) => store.updateCfg({ filled: checked })}
          >
            Fill
          </CheckboxField>
          <CheckboxField
            style={{ flex: 1 }}
            checked={cfg.preview}
            onChange={(checked) => store.updateCfg({ preview: checked })}
          >
            Preview
          </CheckboxField>
        </div>
        <div className="row">
          <CheckboxField
            style={{ flex: 1 }}
            checked={cfg.showTicks}
            onChange={(checked) => store.updateCfg({ showTicks: checked })}
          >
            Show Ticks
          </CheckboxField>
          <CheckboxField
            style={{ flex: 1 }}
            checked={cfg.minifyOutput}
            onChange={(checked) => {
              store.updateCfg({ minifyOutput: checked });
              store.afterModelChange();
            }}
          >
            Minify output
          </CheckboxField>
        </div>
      </Expandable>
    ),
    [
      store,
      cfg.viewPortX,
      cfg.viewPortY,
      cfg.viewPortWidth,
      cfg.viewPortHeight,
      cfg.viewPortLocked,
      cfg.snapToGrid,
      cfg.decimalPrecision,
      cfg.filled,
      cfg.preview,
      cfg.showTicks,
      cfg.minifyOutput,
    ],
  );

  const pathOperationsPanel = useMemo(
    () => (
      <Expandable panelTitle="Path Operations" opened>
        <div className="row path-operations-grid">
          <div className="input-block" style={{ flex: 1 }}>
            <label htmlFor="scale-x">Scale X</label>
            <NumberInput
              id="scale-x"
              className="app-input"
              value={store.scaleX}
              onChange={(value) => setNumber('scaleX', value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  store.scale(store.scaleX, store.scaleY);
                }
              }}
            />
          </div>
          <div className="input-block" style={{ flex: 1 }}>
            <label htmlFor="scale-y">Scale Y</label>
            <NumberInput
              id="scale-y"
              className="app-input"
              value={store.scaleY}
              onChange={(value) => setNumber('scaleY', value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  store.scale(store.scaleX, store.scaleY);
                }
              }}
            />
          </div>
          <AppTooltip title="Scale the full path with provided values" placement="right">
            <FlatButton style={{ flex: 1 }} onClick={() => store.scale(store.scaleX, store.scaleY)}>
              Scale
            </FlatButton>
          </AppTooltip>
        </div>
        <div className="row path-operations-grid">
          <div className="input-block" style={{ flex: 1 }}>
            <label htmlFor="translate-x">Translate X</label>
            <NumberInput
              id="translate-x"
              className="app-input"
              value={store.translateX}
              onChange={(value) => setNumber('translateX', value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  store.translate(store.translateX, store.translateY);
                }
              }}
            />
          </div>
          <div className="input-block" style={{ flex: 1 }}>
            <label htmlFor="translate-y">Translate Y</label>
            <NumberInput
              id="translate-y"
              className="app-input"
              value={store.translateY}
              onChange={(value) => setNumber('translateY', value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  store.translate(store.translateX, store.translateY);
                }
              }}
            />
          </div>
          <AppTooltip title="Translate the full path with provided values" placement="right">
            <FlatButton
              style={{ flex: 1 }}
              onClick={() => store.translate(store.translateX, store.translateY)}
            >
              Translate
            </FlatButton>
          </AppTooltip>
        </div>
        <div className="row path-operations-grid4">
          <div className="input-block" style={{ flex: 1 }}>
            <label htmlFor="origin-x">Origin X</label>
            <NumberInput
              id="origin-x"
              className="app-input"
              value={store.rotateX}
              onChange={(value) => setNumber('rotateX', value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  store.rotate(store.rotateX, store.rotateY, store.rotateAngle);
                }
              }}
            />
          </div>
          <div className="input-block" style={{ flex: 1 }}>
            <label htmlFor="origin-y">Origin Y</label>
            <NumberInput
              id="origin-y"
              className="app-input"
              value={store.rotateY}
              onChange={(value) => setNumber('rotateY', value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  store.rotate(store.rotateX, store.rotateY, store.rotateAngle);
                }
              }}
            />
          </div>
          <div className="input-block" style={{ flex: 1 }}>
            <label htmlFor="rotate-angle">Angle</label>
            <NumberInput
              id="rotate-angle"
              className="app-input"
              suffix="°"
              value={store.rotateAngle}
              onChange={(value) => setNumber('rotateAngle', value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  store.rotate(store.rotateX, store.rotateY, store.rotateAngle);
                }
              }}
            />
          </div>
          <AppTooltip
            title="Rotate the full path by the given angle in degrees about the given point"
            placement="right"
          >
            <FlatButton
              style={{ flex: 1 }}
              onClick={() => store.rotate(store.rotateX, store.rotateY, store.rotateAngle)}
            >
              Rotate
            </FlatButton>
          </AppTooltip>
        </div>
        <div className="row path-operations-grid">
          <div className="input-block" style={{ gridColumn: 'span 2' }}>
            <label htmlFor="round-decimals">Number of decimals</label>
            <NumberInput
              id="round-decimals"
              className="app-input"
              formatterType="positive-integer"
              value={store.roundValuesDecimals}
              onChange={(value) => setNumber('roundValuesDecimals', value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  store.roundValues(store.roundValuesDecimals);
                }
              }}
            />
          </div>
          <AppTooltip
            title="Round all values, input the number of decimals to keep"
            placement="right"
          >
            <FlatButton
              style={{ flex: 1 }}
              onClick={() => store.roundValues(store.roundValuesDecimals)}
            >
              Round
            </FlatButton>
          </AppTooltip>
        </div>
        <div className="row">
          <AppTooltip title="Convert all commands to relative" placement="right">
            <FlatButton style={{ flex: 1 }} onClick={() => store.setRelative(true)}>
              Convert to relative
            </FlatButton>
          </AppTooltip>
          <AppTooltip title="Convert all commands to absolute" placement="right">
            <FlatButton style={{ flex: 1 }} onClick={() => store.setRelative(false)}>
              Convert to absolute
            </FlatButton>
          </AppTooltip>
        </div>
        <div className="row">
          <AppTooltip title="Reverse path commands" placement="right">
            <FlatButton style={{ flex: 1 }} onClick={() => store.reverse()}>
              Reverse
            </FlatButton>
          </AppTooltip>
          <AppTooltip
            title="Optimize the path by removing useless components, changing types and reordering"
            placement="right"
          >
            <FlatButton style={{ flex: 1 }} onClick={() => store.optimize()}>
              Optimize
            </FlatButton>
          </AppTooltip>
        </div>
      </Expandable>
    ),
    // The scalar fields are read while constructing the memoized element.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      store,
      setNumber,
      store.scaleX,
      store.scaleY,
      store.translateX,
      store.translateY,
      store.rotateX,
      store.rotateY,
      store.rotateAngle,
      store.roundValuesDecimals,
    ],
  );

  const storageEmpty = store.storage.isEmpty();
  const pathButtons = useMemo(
    () => (
      <div className="path-buttons">
        <Open />
        <Save />
        <AppTooltip title="Clear path" close>
          <Fab
            size="small"
            color="primary"
            style={{ transform: 'none', margin: '0 4px' }}
            onClick={() => store.reloadPath('', false)}
            aria-label="Clear path"
          >
            <Icon>clear</Icon>
          </Fab>
        </AppTooltip>
        <AppTooltip title="Append new command" close>
          <Fab
            size="small"
            color="secondary"
            style={{ transform: 'none', margin: '0 10px 0 auto' }}
            onClick={(event) => setAddAnchor(event.currentTarget)}
            aria-label="Append new command"
          >
            <Icon>add</Icon>
          </Fab>
        </AppTooltip>
        <CreateCommandMenu
          anchorEl={addAnchor}
          open={addAnchor !== null}
          item={null}
          convert={false}
          onClose={() => setAddAnchor(null)}
        />
      </div>
    ),
    // Storage state is read by the Open button when this element is created.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store, addAnchor, storageEmpty],
  );

  return (
    <div
      className={`left-column-wrapper${closing ? ' left-column-leave' : entering ? ' left-column-enter' : ''}`}
      onAnimationEnd={handleAnimationEnd}
    >
      <RaisedButton
        className="left-column-close"
        style={{ borderRadius: 0 }}
        onClick={onCloseClick}
      >
        <Icon>arrow_left</Icon>
      </RaisedButton>
      <div className="left-column">
        <Expandable panelTitle="Path" panelInfo={store.rawPath.length.toString()} opened>
          <div className="row">
            <div
              className={`input-block${store.invalidSyntax ? ' has-error' : ''}`}
              style={{ flexGrow: 1, minWidth: 0 }}
            >
              <label className="opaque" htmlFor="path-input">
                Path
              </label>
              <AppTooltip title="Invalid path" disabled={!store.invalidSyntax} close>
                <textarea
                  id="path-input"
                  className="app-input"
                  style={{ height: 100 }}
                  value={store.rawPath}
                  placeholder="Paste any SVG path here"
                  onChange={(event) =>
                    store.reloadPath(event.target.value, event.target.value.length > 0)
                  }
                  onFocus={() => store.setHistoryDisabled(true)}
                  onBlur={() => store.setHistoryDisabled(false)}
                />
              </AppTooltip>
            </div>
          </div>
          {pathButtons}
        </Expandable>

        {configurationPanel}
        {pathOperationsPanel}
        <Expandable panelTitle="Commands" opened>
          {store.parsedPath.path.map((item, index) => {
            const signature = [
              item.getType(),
              item.values.join(','),
              item.relative,
              store.focusedItem === item,
              store.hoveredItem === item && !store.draggedPoint,
              store.draggedPoint?.itemReference === item || store.focusedItem === item,
            ].join('|');
            return (
              <CommandRow key={getItemKey(item)} item={item} index={index} signature={signature} />
            );
          })}
        </Expandable>
        <div className="spacer" />
      </div>
    </div>
  );
}
